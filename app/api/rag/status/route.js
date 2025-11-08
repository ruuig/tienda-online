// app/api/rag/status/route.js
import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { DocumentRepositoryImpl } from '@/src/infrastructure/database/repositories';
import { getAuthUser } from '@/lib/auth';

/**
 * GET /api/rag/status
 * Simple RAG system status check
 */
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    const isAuthenticated = !!(user && user.id);

    let status = {
      system: 'initializing',
      database: 'checking',
      openai: 'checking',
      documents: 0,
      chunks: 0,
      embeddings: 0
    };

    // Check database connection
    try {
      const mongoose = await import('mongoose');
      status.database = mongoose.default.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch (error) {
      status.database = 'error';
    }

    // Check OpenAI
    status.openai = process.env.OPENAI_API_KEY ? 'configured' : 'missing';

    // Count documents if authenticated
    if (isAuthenticated && status.database === 'connected') {
      try {
        const documentRepository = new DocumentRepositoryImpl();
        const documents = await documentRepository.findAll({ isActive: true });

        status.documents = documents.length;
        status.chunks = documents.reduce((sum, doc) => sum + (doc.chunks?.length || 0), 0);
        status.embeddings = documents.reduce((sum, doc) => sum + (doc.chunks?.length || 0), 0);

        status.system = documents.length > 0 ? 'ready' : 'no_documents';
      } catch (error) {
        status.system = 'error';
      }
    } else {
      status.system = 'unauthenticated';
    }

    const isWorking = status.database === 'connected' &&
                     status.openai === 'configured' &&
                     status.system === 'ready';

    return NextResponse.json({
      success: true,
      message: isWorking ? 'RAG System is fully operational' : 'RAG System needs attention',
      status,
      isWorking,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking RAG status:', error);
    return NextResponse.json({
      success: false,
      message: 'Error checking RAG system status',
      error: error.message,
      status: {
        system: 'error',
        database: 'error',
        openai: 'error'
      }
    }, { status: 500 });
  }
}
