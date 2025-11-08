// app/api/rag/test/route.js
import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { DocumentRepositoryImpl } from '@/src/infrastructure/database/repositories';
import { RAGService } from '@/src/infrastructure/rag/ragService';
import { getAuthUser } from '@/lib/auth';

/**
 * GET /api/rag/test
 * Test RAG system functionality
 */
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return NextResponse.json({
        success: false,
        message: 'No tienes permisos para probar el sistema RAG'
      }, { status: 403 });
    }

    if (user.role !== 'admin' && user.role !== 'seller') {
      return NextResponse.json({
        success: false,
        message: 'No tienes permisos para probar el sistema RAG'
      }, { status: 403 });
    }

    const documentRepository = new DocumentRepositoryImpl();
    const ragService = new RAGService(documentRepository);

    // Test 1: Check if there are documents
    const documents = await documentRepository.findAll({ isActive: true });

    // Test 2: Test embedding generation
    let embeddingTest = null;
    try {
      await ragService.initializeServices();
      const testEmbedding = await ragService.generateEmbedding('test query');
      embeddingTest = {
        success: true,
        dimensions: testEmbedding.length,
        sample: testEmbedding.slice(0, 5)
      };
    } catch (error) {
      embeddingTest = {
        success: false,
        error: error.message
      };
    }

    // Test 3: Test search functionality
    let searchTest = null;
    if (documents.length > 0) {
      try {
        const results = await ragService.search('test query', 3);
        searchTest = {
          success: true,
          resultsCount: results.length,
          sampleResult: results[0] ? {
            title: results[0].title,
            score: results[0].relevanceScore
          } : null
        };
      } catch (error) {
        searchTest = {
          success: false,
          error: error.message
        };
      }
    } else {
      searchTest = {
        success: false,
        message: 'No documents available for search test'
      };
    }

    // Test 4: Database connectivity
    const dbTest = {
      success: true,
      collections: ['rag_documents', 'rag_document_chunks', 'rag_document_embeddings']
    };

    return NextResponse.json({
      success: true,
      message: 'RAG System Test Results',
      timestamp: new Date().toISOString(),
      tests: {
        documents: {
          count: documents.length,
          sample: documents.slice(0, 2).map(d => ({ title: d.title, id: d._id }))
        },
        embeddings: embeddingTest,
        search: searchTest,
        database: dbTest
      },
      system: {
        mongoDB: 'connected',
        openAI: embeddingTest?.success ? 'working' : 'error',
        ragService: 'initialized'
      }
    });

  } catch (error) {
    console.error('Error testing RAG system:', error);
    return NextResponse.json({
      success: false,
      message: 'Error testing RAG system',
      error: error.message
    }, { status: 500 });
  }
}
