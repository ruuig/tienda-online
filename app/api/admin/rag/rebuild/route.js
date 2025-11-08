// API para reconstruir índice RAG del administrador
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import { getSharedRAGService } from '@/src/infrastructure/rag/ragServiceRegistry.js';

export async function POST(request) {
  try {
    console.log('🔄 Iniciando reconstrucción del índice RAG...');

    await connectDB();

    let vendorId = null;
    try {
      const body = await request.json();
      vendorId = body?.vendorId || null;
    } catch (parseError) {
      vendorId = null;
    }

    const ragService = getSharedRAGService();
    const rebuildResult = await ragService.rebuildIndex({ vendorId });
    const stats = ragService.getStats({ vendorId });

    console.log('✅ Índice RAG reconstruido exitosamente:', {
      documents: rebuildResult.documentsIndexed,
      chunks: rebuildResult.chunksIndexed,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Índice RAG reconstruido exitosamente',
      stats: {
        documentsProcessed: rebuildResult.documentsIndexed,
        chunksIndexed: rebuildResult.chunksIndexed,
        totalSize: stats.memoryUsage
      }
    });

  } catch (error) {
    console.error('❌ Error reconstruyendo índice RAG:', error);
    return NextResponse.json(
      { success: false, message: 'Error reconstruyendo índice RAG' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    const ragService = getSharedRAGService();
    await ragService.ensureIndexLoaded({ vendorId });
    const stats = ragService.getStats({ vendorId });

    return NextResponse.json({
      success: true,
      stats: {
        totalChunks: stats.totalDocuments,
        indexedChunks: stats.indexedChunks,
        memoryUsage: stats.memoryUsage,
        lastUpdate: stats.lastUpdate
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas RAG:', error);
    return NextResponse.json(
      { success: false, message: 'Error obteniendo estadísticas' },
      { status: 500 }
    );
  }
}
