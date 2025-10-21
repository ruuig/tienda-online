// API para gestión de documentos RAG
import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { DocumentRepositoryImpl } from '@/src/infrastructure/database/repositories';
import { RAGService } from '@/src/infrastructure/rag/ragService';
import { getAuthUser } from '@/lib/auth';

// GET /api/chat/rag/documents - Obtener documentos activos para RAG
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'No tienes permisos para ver documentos RAG'
      }, { status: 403 });
    }

    const documentRepository = new DocumentRepositoryImpl();
    const documents = await documentRepository.findAll({ isActive: true });

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

    const user = await getAuthUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'No tienes permisos para reconstruir el índice RAG'
      }, { status: 403 });
    }

    const documentRepository = new DocumentRepositoryImpl();
    const ragService = new RAGService(documentRepository);

    // Reconstruir índice
    await ragService.rebuildIndex();

    const stats = ragService.getStats();

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

    const user = await getAuthUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'No tienes permisos para ver estadísticas RAG'
      }, { status: 403 });
    }

    const documentRepository = new DocumentRepositoryImpl();
    const ragService = new RAGService(documentRepository);

    const stats = ragService.getStats();

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
