// API para gestión de documentos RAG
import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { getSharedRAGService } from '@/src/infrastructure/rag/ragServiceRegistry.js';

// GET /api/chat/rag/documents - Obtener documentos activos para RAG
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    const ragService = getSharedRAGService();
    await ragService.ensureIndexLoaded({ vendorId });
    const documents = ragService.getIndexedDocuments(vendorId);

    return NextResponse.json({
      success: true,
      documents: documents || []
    });

  } catch (error) {
    console.error('Error obteniendo documentos RAG:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST /api/chat/rag/rebuild-index - Reconstruir índice RAG
export async function POST(request) {
  try {
    await connectDB();

    const ragService = getSharedRAGService();

    let vendorId = null;
    try {
      const body = await request.json();
      vendorId = body?.vendorId || null;
    } catch (parseError) {
      vendorId = null;
    }

    await ragService.ensureIndexLoaded({ vendorId, force: true });

    const stats = ragService.getStats({ vendorId });

    return NextResponse.json({
      success: true,
      message: 'Índice RAG reconstruido exitosamente',
      stats
    });

  } catch (error) {
    console.error('Error reconstruyendo índice RAG:', error);
    return NextResponse.json({
      success: false,
      message: 'Error reconstruyendo índice RAG'
    }, { status: 500 });
  }
}

// GET /api/chat/rag/stats - Obtener estadísticas del sistema RAG
export async function GET_STATS(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const ragService = getSharedRAGService();

    await ragService.ensureIndexLoaded({ vendorId });

    const stats = ragService.getStats({ vendorId });

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas RAG:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
