// API para indexar documentos con RAG simplificado
import { NextResponse } from 'next/server';
import connectDB from '@/src/infrastructure/database/db.js';
import { Document, DocumentChunk } from '@/src/infrastructure/database/models/index.js';
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

    // Verificar que el documento existe y pertenece al vendedor
    const document = await Document.findOne({
      _id: documentId,
      vendorId,
      isActive: true
    });

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
      document.contentText
    );

    // Actualizar documento como indexado
    await Document.findByIdAndUpdate(documentId, {
      lastIndexed: new Date()
    });

    console.log('✅ Documento indexado en RAG:', {
      documentId,
      embeddingLength: result.embeddingLength,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Documento indexado exitosamente en el sistema RAG',
      document: {
        id: document._id,
        filename: document.filename,
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

    // Re-indexar todos los documentos del vendedor
    const documents = await Document.find({
      vendorId,
      isActive: true
    });

    let successful = 0;
    let failed = 0;
    const results = [];

    for (const doc of documents) {
      try {
        await ragService.addDocument(
          doc._id.toString(),
          vendorId,
          doc.contentText
        );
        successful++;
        results.push({ documentId: doc._id, success: true });
      } catch (error) {
        failed++;
        results.push({ documentId: doc._id, success: false, error: error.message });
      }
    }

    const success = failed === 0;
    const result = {
      success,
      totalDocuments: documents.length,
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
