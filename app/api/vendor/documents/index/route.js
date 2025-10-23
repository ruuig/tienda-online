// API para indexar documentos en FAISS
import { NextResponse } from 'next/server';
import connectDB from '@/src/infrastructure/database/db.js';
import { Document } from '@/src/infrastructure/database/models/index.js';
import { getSharedRAGService } from '@/src/infrastructure/rag/ragServiceRegistry.js';

const ragService = getSharedRAGService();

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

    const plainDocument = typeof document.toObject === 'function' ? document.toObject() : document;
    const [indexedDocument] = await ragService.buildIndex([plainDocument], {
      vendorId,
      replaceExisting: false,
    });

    const chunksIndexed = indexedDocument?.chunks?.length || 0;

    console.log(`✅ Documento indexado: ${documentId} (${chunksIndexed} chunks)`);

    return NextResponse.json({
      success: true,
      message: 'Documento indexado exitosamente en el sistema RAG',
      document: {
        id: document._id,
        filename: document.filename,
        chunksIndexed,
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

    const result = await ragService.rebuildIndex({ vendorId });

    console.log(`✅ Re-indexación completada para vendor ${vendorId}`);

    return NextResponse.json({
      success: true,
      message: 'Todos los documentos han sido re-indexados exitosamente',
      stats: {
        totalDocuments: result.documentsIndexed,
        successful: result.documentsIndexed,
        failed: 0
      },
      results: []
    });

  } catch (error) {
    console.error('❌ Error re-indexando documentos:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', error: error.message },
      { status: 500 }
    );
  }
}
