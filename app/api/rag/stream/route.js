// app/api/rag/stream/route.js
import { NextResponse } from 'next/server';
import { AskQuestionUseCase } from '../../../src/application/useCases/AskQuestionUseCase.js';
import { MongoVectorRepository } from '../../../src/infrastructure/database/MongoVectorRepository.js';
import { OpenAIEmbeddingsService } from '../../../src/infrastructure/embeddings/OpenAIEmbeddingsService.js';
import { OpenAILLMService } from '../../../src/infrastructure/llm/OpenAILLMService.js';
import { productContextService } from '../../../src/services/productContextService.js';

// Initialize services
const vectorRepository = new MongoVectorRepository();
const embeddingsService = new OpenAIEmbeddingsService();
const llmService = new OpenAILLMService();
const askQuestionUseCase = new AskQuestionUseCase(
  vectorRepository,
  embeddingsService,
  llmService,
  productContextService
);

/**
 * POST /api/rag/stream
 * Stream RAG responses in real-time
 */
export async function POST(request) {
  try {
    const { message, documentId, vendorId } = await request.json();

    if (!message) {
      return NextResponse.json({
        success: false,
        message: 'Message is required'
      }, { status: 400 });
    }

    console.log(`Streaming RAG response for: ${message.substring(0, 100)}...`);

    // Set up streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const token of askQuestionUseCase.stream({
            question: message,
            documentId,
            vendorId: vendorId || 'default_vendor'
          })) {
            controller.enqueue(encoder.encode(token));
          }
        } catch (error) {
          console.error('Error in RAG streaming:', error);
          controller.enqueue(encoder.encode('Lo siento, estoy teniendo problemas para procesar tu consulta.'));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error in RAG stream route:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing stream request',
      error: error.message
    }, { status: 500 });
  }
}
