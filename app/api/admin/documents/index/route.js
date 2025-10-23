// API para indexar documentos con RAG simplificado
import { NextResponse } from 'next/server';
import connectDB from '@/src/infrastructure/database/db.js';
import fs from 'fs';
import path from 'path';
import { existsSync } from 'fs';
import { join } from 'path';
import { createSimpleRAGService } from '@/src/infrastructure/rag/simpleRagService.js';

const ragService = createSimpleRAGService(process.env.OPENAI_API_KEY);

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { documentId } = body;

    // TODO: Validar autenticación de vendedor
    const vendorId = '507f1f77bcf86cd799439011'; // Temporal

    if (!documentId) {
      return NextResponse.json(
        { success: false, message: 'ID de documento requerido' },
        { status: 400 }
      );
    }

    // Buscar documento en el sistema de archivos (sincronizado con el sistema principal)
    const documentsDir = join(process.cwd(), 'documents');
    const documentsIndexPath = join(documentsDir, 'index.json');

    if (!existsSync(documentsIndexPath)) {
      return NextResponse.json(
        { success: false, message: 'No se encontraron documentos' },
        { status: 404 }
      );
    }

    const indexData = fs.readFileSync(documentsIndexPath, 'utf8');
    const documents = JSON.parse(indexData);

    // Buscar el documento por ID
    const document = documents.find(doc => doc.id === documentId && doc.isActive);

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Indexar documento con RAG simplificado
    const result = await ragService.addDocument(
      documentId,
      vendorId,
      document.content || document.description || ''
    );

    // Actualizar documento en el índice de archivos
    const documentIndex = documents.findIndex(doc => doc.id === documentId);
    if (documentIndex !== -1) {
      documents[documentIndex].lastIndexed = new Date().toISOString();
      fs.writeFileSync(documentsIndexPath, JSON.stringify(documents, null, 2));
    }

    console.log('✅ Documento indexado en RAG:', {
      documentId,
      embeddingLength: result.embeddingLength,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Documento indexado exitosamente en el sistema RAG',
      document: {
        id: document.id,
        filename: document.fileName,
        embeddingLength: result.embeddingLength,
        lastIndexed: new Date()
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

    // TODO: Validar autenticación de vendedor
    const vendorId = vendorIdParam || '507f1f77bcf86cd799439011'; // Temporal

    if (!vendorId) {
      return NextResponse.json(
        { success: false, message: 'VendorId requerido' },
        { status: 400 }
      );
    }

    // Re-indexar todos los documentos del vendedor desde el sistema de archivos
    const documentsDir = join(process.cwd(), 'documents');
    const documentsIndexPath = join(documentsDir, 'index.json');

    if (!existsSync(documentsIndexPath)) {
      return NextResponse.json(
        { success: false, message: 'No se encontraron documentos' },
        { status: 404 }
      );
    }

    const indexData = fs.readFileSync(documentsIndexPath, 'utf8');
    const documents = JSON.parse(indexData);

    // Filtrar documentos activos del vendor
    const activeDocuments = documents.filter(doc => doc.isActive);

    let successful = 0;
    let failed = 0;
    const results = [];

    for (const doc of activeDocuments) {
      try {
        await ragService.addDocument(
          doc.id,
          vendorId,
          doc.content || doc.description || ''
        );
        successful++;
        results.push({ documentId: doc.id, success: true });
      } catch (error) {
        failed++;
        results.push({ documentId: doc.id, success: false, error: error.message });
      }
    }

    // Actualizar todos los documentos como indexados
    const updatedDocuments = documents.map(doc => {
      if (doc.isActive) {
        return { ...doc, lastIndexed: new Date().toISOString() };
      }
      return doc;
    });
    fs.writeFileSync(documentsIndexPath, JSON.stringify(updatedDocuments, null, 2));

    const success = failed === 0;
    const result = {
      success,
      totalDocuments: activeDocuments.length,
      successful,
      failed,
      results
    };

    console.log('✅ Re-indexación completada:', {
      vendorId,
      totalDocuments: result.totalDocuments,
      successful: result.successful,
      failed: result.failed,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? 'Todos los documentos han sido re-indexados exitosamente'
        : 'Algunos documentos no pudieron ser indexados',
      stats: {
        totalDocuments: result.totalDocuments,
        successful: result.successful,
        failed: result.failed
      },
      results: result.results
    });

  } catch (error) {
    console.error('❌ Error re-indexando documentos:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', error: error.message },
      { status: 500 }
    );
  }
}
