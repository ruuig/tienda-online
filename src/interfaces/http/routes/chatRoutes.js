// src/interfaces/http/routes/chatRoutes.js
import express from 'express';
import { AskQuestionUseCase } from '../../application/useCases/AskQuestionUseCase.js';
import { MongoVectorRepository } from '../../infrastructure/database/MongoVectorRepository.js';
import { OpenAIEmbeddingsService } from '../../infrastructure/embeddings/OpenAIEmbeddingsService.js';
import { OpenAILLMService } from '../../infrastructure/llm/OpenAILLMService.js';
import { productContextService } from '../../services/productContextService.js';

const router = express.Router();

// Initialize services and use cases
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
 * POST /api/chat/rag
 * Process a chat message using RAG system
 */
router.post('/rag', async (req, res) => {
  try {
    const { message, conversationId, documentId, vendorId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    console.log(`Processing RAG message: ${message.substring(0, 100)}...`);

    // Start streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';

    try {
      for await (const token of askQuestionUseCase.stream({
        question: message,
        documentId,
        vendorId: vendorId || 'default_vendor'
      })) {
        fullResponse += token;
        res.write(token);
      }
    } catch (error) {
      console.error('Error in RAG streaming:', error);
      res.write('Lo siento, estoy teniendo problemas para procesar tu consulta.');
    }

    res.end();

    // Log the conversation (optional)
    console.log(`RAG Response: ${fullResponse.substring(0, 100)}...`);

  } catch (error) {
    console.error('Error in RAG chat route:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing chat message',
      error: error.message
    });
  }
});

/**
 * GET /api/chat/documents
 * Get available documents for a vendor
 */
router.get('/documents', async (req, res) => {
  try {
    const vendorId = req.user?.id || req.query.vendorId || 'default_vendor';

    const documents = await productContextService.getDocumentsForVendor(vendorId);

    res.json({
      success: true,
      documents
    });

  } catch (error) {
    console.error('Error getting chat documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving documents',
      error: error.message
    });
  }
});

export default router;
