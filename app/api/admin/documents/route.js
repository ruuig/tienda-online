// API para gestión de documentos RAG del administrador
import { NextResponse } from 'next/server';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

import connectDB from '../../../../src/infrastructure/database/db.js';
import { Document, DocumentChunk } from '../../../../src/infrastructure/database/models/index.js';
import { DocumentRepositoryImpl } from '../../../../src/infrastructure/database/repositories.js';
import { createRAGService } from '../../../../src/infrastructure/rag/ragService.js';

const ragService = createRAGService(new DocumentRepositoryImpl());
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = ['faq', 'manual', 'policy', 'guide', 'other'];
const ALLOWED_CATEGORIES = ['products', 'orders', 'account', 'shipping', 'returns', 'technical', 'other'];

let cachedPdfParse;

async function getPdfParse() {
  if (cachedPdfParse) {
    return cachedPdfParse;
  }

  const testPath = process.env.PDF_PARSE_TEST_MODULE_PATH;
  if (testPath) {
    const module = await import(testPath);
    cachedPdfParse = module.default || module;
    return cachedPdfParse;
  }

  const module = await import('pdf-parse');
  cachedPdfParse = module.default || module;
  return cachedPdfParse;
}

function normalizeType(type) {
  if (!type) return 'other';
  const normalized = type.toString().trim().toLowerCase();
  return ALLOWED_TYPES.includes(normalized) ? normalized : 'other';
}

function normalizeCategory(category) {
  if (!category) return 'other';
  const normalized = category.toString().trim().toLowerCase();
  return ALLOWED_CATEGORIES.includes(normalized) ? normalized : 'other';
}

function inferTitleFromFile(fileName) {
  if (!fileName) return 'Documento sin título';
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[\-_]+/g, ' ')
    .trim() || 'Documento sin título';
}

function validateFileInput(file) {
  if (!file) {
    return {
      body: { success: false, message: 'Archivo requerido' },
      init: { status: 400 }
    };
  }

  if (file.type !== 'application/pdf') {
    return {
      body: { success: false, message: 'Solo se permiten archivos PDF' },
      init: { status: 400 }
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      body: { success: false, message: 'El archivo no puede ser mayor a 10MB' },
      init: { status: 400 }
    };
  }

  return null;
}

function getVendorIdFromRequest(formData) {
  const formVendorId = formData.get('vendorId');
  if (formVendorId) {
    return formVendorId.toString();
  }

  return (
    process.env.DEFAULT_VENDOR_ID ||
    process.env.NEXT_PUBLIC_VENDOR_ID ||
    'default_vendor'
  );
}

function normalizeDescription(description) {
  if (description === undefined || description === null) {
    return null;
  }

  const trimmed = description.toString().trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTitle(title, fallbackFileName) {
  if (title) {
    const trimmed = title.toString().trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return inferTitleFromFile(fallbackFileName);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const type = formData.get('type');
    const category = formData.get('category');
    const description = formData.get('description');

    // Validar autenticación de seller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('seller@tienda.com')) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const validationError = validateFileInput(file);
    if (validationError) {
      return NextResponse.json(validationError.body, validationError.init);
    }

    const normalizedType = normalizeType(type);
    const normalizedCategory = normalizeCategory(category);
    const normalizedTitle = normalizeTitle(title, file?.name);
    const normalizedDescription = normalizeDescription(description);
    const vendorId = getVendorIdFromRequest(formData);

    await connectDB();

    const uploadDir = join(process.cwd(), 'uploads', 'documents', vendorId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    let extractedText = '';
    try {
      const pdfParse = await getPdfParse();
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || '';
    } catch (error) {
      console.warn('Error extrayendo texto del PDF:', error);
      extractedText = '';
    }

    const normalizedContent = extractedText.trim() || 'Contenido no extraíble automáticamente';

    const document = await Document.create({
      vendorId,
      title: normalizedTitle,
      content: normalizedContent,
      contentText: normalizedContent,
      type: normalizedType,
      category: normalizedCategory,
      fileName,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
      version: 1,
      isActive: true,
      uploadDate: new Date(),
      lastIndexed: null,
      metadata: {
        uploadedBy: 'admin@tienda.com',
        source: 'admin-dashboard',
        description: normalizedDescription,
        originalName: file.name
      }
    });

    const rawChunks = ragService.splitIntoChunks(normalizedContent, 500);
    let searchStartIndex = 0;
    const chunkDocuments = rawChunks
      .map((chunkText, index) => {
        const text = chunkText.trim();
        if (!text) {
          return null;
        }

        let startIndex = normalizedContent.indexOf(text, searchStartIndex);
        if (startIndex === -1) {
          startIndex = searchStartIndex;
        }

        const endIndex = startIndex + text.length;
        searchStartIndex = endIndex;

        return {
          documentId: document._id,
          chunkText: text,
          chunkIndex: index,
          tokenCount: text.split(/\s+/).filter(Boolean).length,
          startIndex,
          endIndex
        };
      })
      .filter(Boolean);

    if (chunkDocuments.length > 0) {
      await DocumentChunk.insertMany(chunkDocuments);
    }

    const indexedDocuments = await ragService.buildIndex([document], { vendorId });
    const indexedDocument = indexedDocuments?.[0] || document;

    console.log('✅ Documento PDF subido por admin:', {
      id: document._id.toString(),
      title: normalizedTitle,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Documento subido exitosamente',
      document: {
        id: document._id.toString(),
        title: normalizedTitle,
        type: normalizedType,
        category: normalizedCategory,
        description: normalizedDescription,
        fileName,
        filePath,
        fileSize: file.size,
        mimeType: file.type,
        vendorId,
        isActive: document.isActive,
        chunksCount: indexedDocument?.chunks?.length ?? chunkDocuments.length,
        lastIndexed: indexedDocument?.lastIndexed
          ? new Date(indexedDocument.lastIndexed).toISOString()
          : null,
        metadata: document.metadata
      }
    });
  } catch (error) {
    console.error('❌ Error subiendo documento:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Validar autenticación de seller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('seller@tienda.com')) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || process.env.DEFAULT_VENDOR_ID || process.env.NEXT_PUBLIC_VENDOR_ID || 'default_vendor';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const query = { vendorId };

    const [documents, totalDocuments] = await Promise.all([
      Document.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Document.countDocuments(query)
    ]);

    const [statsAggregation, chunkAggregation] = await Promise.all([
      Document.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalDocuments: { $sum: 1 },
            totalSize: { $sum: { $ifNull: ['$fileSize', 0] } },
            activeDocuments: {
              $sum: {
                $cond: [{ $eq: ['$isActive', true] }, 1, 0]
              }
            },
            indexedDocuments: {
              $sum: {
                $cond: [{ $ifNull: ['$lastIndexed', false] }, 1, 0]
              }
            }
          }
        }
      ]),
      documents.length > 0
        ? DocumentChunk.aggregate([
            { $match: { documentId: { $in: documents.map(doc => doc._id) } } },
            {
              $group: {
                _id: '$documentId',
                count: { $sum: 1 }
              }
            }
          ])
        : []
    ]);

    const chunkCountMap = new Map(
      chunkAggregation.map(item => [item._id.toString(), item.count])
    );

    const normalizedDocuments = documents.map(doc => ({
      id: doc._id.toString(),
      title: doc.title,
      type: doc.type,
      category: doc.category,
      description: doc.metadata?.description || null,
      fileName: doc.fileName,
      filePath: doc.filePath,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      vendorId: doc.vendorId,
      isActive: doc.isActive,
      createdAt: doc.createdAt?.toISOString?.() || new Date(doc.createdAt).toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() || new Date(doc.updatedAt).toISOString(),
      lastIndexed: doc.lastIndexed ? doc.lastIndexed.toISOString() : null,
      chunksCount: chunkCountMap.get(doc._id.toString()) || 0,
      metadata: doc.metadata || {}
    }));

    const stats = statsAggregation[0] || {
      totalDocuments: 0,
      totalSize: 0,
      activeDocuments: 0,
      indexedDocuments: 0
    };

    return NextResponse.json({
      success: true,
      documents: normalizedDocuments,
      pagination: {
        page,
        limit,
        totalDocuments,
        totalPages: Math.ceil(totalDocuments / limit) || 1
      },
      stats: {
        totalDocuments: stats.totalDocuments || 0,
        totalSize: stats.totalSize || 0,
        activeDocuments: stats.activeDocuments || 0,
        indexedDocuments: stats.indexedDocuments || 0,
        lastIndexed: normalizedDocuments.reduce((latest, doc) => {
          if (!doc.lastIndexed) return latest;
          const current = new Date(doc.lastIndexed);
          return !latest || current > latest ? current : latest;
        }, null)?.toISOString() || null
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo documentos:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    // Validar autenticación de seller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('seller@tienda.com')) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { success: false, message: 'ID de documento requerido' },
        { status: 400 }
      );
    }

    await connectDB();

    const document = await Document.findById(documentId);
    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    if (document.filePath && existsSync(document.filePath)) {
      try {
        await unlink(document.filePath);
      } catch (error) {
        console.warn('No se pudo eliminar el archivo físico:', error);
      }
    }

    await DocumentChunk.deleteMany({ documentId: document._id });
    await Document.findByIdAndDelete(documentId);

    try {
      await ragService.rebuildIndex({ vendorId: document.vendorId });
    } catch (error) {
      console.warn('No se pudo reconstruir el índice RAG después de eliminar el documento:', error);
    }

    console.log('✅ Documento eliminado por admin:', {
      id: documentId,
      title: document.title,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando documento:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, isActive, title, description, type, category } = body;

    // Validar autenticación de seller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('seller@tienda.com')) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID de documento requerido' },
        { status: 400 }
      );
    }

    await connectDB();

    const updateFields = {};

    if (isActive !== undefined) {
      updateFields.isActive = !!isActive;
    }

    if (title !== undefined) {
      updateFields.title = normalizeTitle(title, undefined);
    }

    if (description !== undefined) {
      updateFields['metadata.description'] = normalizeDescription(description);
    }

    if (type !== undefined) {
      updateFields.type = normalizeType(type);
    }

    if (category !== undefined) {
      updateFields.category = normalizeCategory(category);
    }

    updateFields.updatedAt = new Date();

    const document = await Document.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      document: {
        id: document._id.toString(),
        title: document.title,
        type: document.type,
        category: document.category,
        description: document.metadata?.description || null,
        isActive: document.isActive,
        updatedAt: document.updatedAt?.toISOString() || new Date(document.updatedAt).toISOString(),
        lastIndexed: document.lastIndexed ? document.lastIndexed.toISOString() : null
      }
    });
  } catch (error) {
    console.error('❌ Error actualizando documento:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
