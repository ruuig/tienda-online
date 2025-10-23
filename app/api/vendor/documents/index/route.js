// API para indexar documentos en FAISS
import { NextResponse } from 'next/server';
import connectDB from '@/src/infrastructure/database/db.js';
import { Document } from '@/src/infrastructure/database/models/index.js';
import { createRAGService } from '@/src/infrastructure/rag/ragService.js';

const ragService = createRAGService(process.env.OPENAI_API_KEY);

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

    // Indexar documento con RAG
    const result = await ragService.indexDocument(documentId, vendorId);

    console.log(`✅ Documento indexado: ${documentId} (${result.chunksIndexed} chunks)`);

    return NextResponse.json({
      success: true,
      message: 'Documento indexado exitosamente en el sistema RAG',
      document: {
        id: document._id,
        filename: document.filename,
        chunksIndexed: result.chunksIndexed,
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
    const result = await ragService.reindexAllDocuments(vendorId);

    console.log(`✅ Re-indexación completada para vendor ${vendorId}`);

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
