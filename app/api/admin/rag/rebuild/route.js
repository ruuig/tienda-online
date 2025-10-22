// API para reconstruir índice RAG del administrador
import { NextResponse } from 'next/server';
import { ragService } from '@/src/infrastructure/rag/ragService.js';
import { documentRepository } from '@/src/infrastructure/database/repositories/documentRepository.js';

export async function POST(request) {
  try {
    // Validar autenticación de seller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('seller@tienda.com')) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    console.log('🔄 Iniciando reconstrucción del índice RAG...');

    // Obtener documentos activos
    const documents = await documentRepository.findAll({ isActive: true });

    if (documents.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No hay documentos activos para indexar' },
        { status: 400 }
      );
    }

    // Preparar documentos para RAG (necesitan _id, title, content, type, category)
    const ragDocuments = documents.map(doc => ({
      _id: doc.id,
      title: doc.title,
      content: doc.content || doc.description || '',
      type: doc.type,
      category: doc.category
    }));

    // Reconstruir índice
    await ragService.rebuildIndex(ragDocuments);

    // Obtener estadísticas actualizadas
    const stats = ragService.getStats();

    console.log('✅ Índice RAG reconstruido exitosamente:', {
      documents: documents.length,
      chunks: stats.indexedChunks,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Índice RAG reconstruido exitosamente',
      stats: {
        documentsProcessed: documents.length,
        chunksIndexed: stats.indexedChunks,
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
    // Validar autenticación de seller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('seller@tienda.com')) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Obtener estadísticas del RAG
    const stats = ragService.getStats();

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
