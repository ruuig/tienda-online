// API para indexar documentos con RAG persistente
import { NextResponse } from 'next/server';
import connectDB from '@/src/infrastructure/database/db.js';
import { Document, DocumentChunk } from '@/src/infrastructure/database/models/index.js';
import { getSharedRAGService } from '@/src/infrastructure/rag/ragServiceRegistry.js';

const ragService = getSharedRAGService();

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { documentId, vendorId: vendorIdParam } = body;

    if (!documentId) {
      return NextResponse.json(
        { success: false, message: 'ID de documento requerido' },
        { status: 400 }
      );
    }

    const document = await Document.findOne({
      _id: documentId,
      isActive: true,
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    const resolvedVendorId = (
      document.vendorId ||
      vendorIdParam ||
      ragService?.defaultVendorId ||
      process.env.DEFAULT_VENDOR_ID ||
      process.env.NEXT_PUBLIC_VENDOR_ID
    )?.toString();

    if (!resolvedVendorId) {
      return NextResponse.json(
        { success: false, message: 'VendorId no disponible para el documento' },
        { status: 400 }
      );
    }

    if (vendorIdParam && document.vendorId?.toString() !== vendorIdParam) {
      return NextResponse.json(
        { success: false, message: 'No tienes permisos para indexar este documento' },
        { status: 403 }
      );
    }

    const plainDocument = typeof document.toObject === 'function'
      ? document.toObject({ depopulate: true })
      : document;

    plainDocument.vendorId = resolvedVendorId;

    const [indexedDocument] = await ragService.buildIndex([plainDocument], {
      vendorId: resolvedVendorId,
      replaceExisting: false,
    });

    if (!indexedDocument) {
      return NextResponse.json(
        { success: false, message: 'No se pudo indexar el documento' },
        { status: 500 }
      );
    }

    const indexedAt = indexedDocument.lastIndexed
      ? new Date(indexedDocument.lastIndexed)
      : new Date();

    await Document.updateOne(
      { _id: document._id },
      { $set: { lastIndexed: indexedAt } }
    );

    const chunkDocuments = Array.isArray(indexedDocument.chunks)
      ? indexedDocument.chunks
          .map((chunk, index) => {
            const chunkText = (chunk?.content || '').trim();
            if (!chunkText) {
              return null;
            }

            const startIndex = typeof chunk.startIndex === 'number'
              ? chunk.startIndex
              : index * (ragService?.options?.chunkSize || 500);
            const endIndex = typeof chunk.endIndex === 'number'
              ? chunk.endIndex
              : startIndex + chunkText.length;

            return {
              documentId: document._id,
              chunkText,
              chunkIndex: index,
              tokenCount: chunkText.split(/\s+/).filter(Boolean).length,
              startIndex,
              endIndex,
              lastIndexed: indexedAt,
            };
          })
          .filter(Boolean)
      : [];

    await DocumentChunk.deleteMany({ documentId: document._id });
    if (chunkDocuments.length > 0) {
      await DocumentChunk.insertMany(chunkDocuments);
    }

    const chunksIndexed = chunkDocuments.length;

    console.log('✅ Documento indexado en RAG (persistente):', {
      documentId,
      vendorId: resolvedVendorId,
      chunksIndexed,
      indexedAt: indexedAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Documento indexado exitosamente en el sistema RAG',
      document: {
        id: document._id,
        vendorId: resolvedVendorId,
        title: document.title,
        filename: document.fileName,
        chunksIndexed,
        lastIndexed: indexedAt,
      }
    });

  } catch (error) {
    console.error('❌ Error indexando documento:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { vendorId: vendorIdParam } = body;

    const vendorId = vendorIdParam || ragService?.defaultVendorId || process.env.DEFAULT_VENDOR_ID || process.env.NEXT_PUBLIC_VENDOR_ID;

    if (!vendorId) {
      return NextResponse.json(
        { success: false, message: 'VendorId requerido' },
        { status: 400 }
      );
    }

    const result = await ragService.rebuildIndex({ vendorId });

    console.log('✅ Re-indexación completada (persistente):', {
      vendorId,
      documentsIndexed: result.documentsIndexed,
      chunksIndexed: result.chunksIndexed,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Índice reconstruido exitosamente',
      stats: {
        totalDocuments: result.documentsIndexed,
        successful: result.documentsIndexed,
        failed: 0,
        chunksIndexed: result.chunksIndexed,
      },
      results: [],
    });

  } catch (error) {
    console.error('❌ Error re-indexando documentos:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', error: error.message },
      { status: 500 }
    );
  }
}
