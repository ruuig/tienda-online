// src/interfaces/http/routes/ragRoutes.js
import express from 'express';
import multer from 'multer';
import { UploadDocumentUseCase } from '../../application/useCases/UploadDocumentUseCase.js';
import { MongoDocumentRepository } from '../../infrastructure/database/MongoDocumentRepository.js';
import { MongoVectorRepository } from '../../infrastructure/database/MongoVectorRepository.js';
import { OpenAIEmbeddingsService } from '../../infrastructure/embeddings/OpenAIEmbeddingsService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize repositories and use cases
const documentRepository = new MongoDocumentRepository();
const vectorRepository = new MongoVectorRepository();
const embeddingsService = new OpenAIEmbeddingsService();
const uploadDocumentUseCase = new UploadDocumentUseCase(
  documentRepository,
  vectorRepository,
  embeddingsService
);

/**
 * GET /api/rag/health
 * Health check for RAG system
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'RAG system is operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/rag/documents
 * Upload a document for RAG processing
 */
router.post('/documents', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    const { title } = req.body;
    const ownerId = req.user?.id || req.body.vendorId || 'default_vendor';

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Validate file type
    if (file.mimetype !== 'application/pdf' && !file.mimetype.startsWith('text/')) {
      return res.status(400).json({
        success: false,
        message: 'Only PDF and text files are supported'
      });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size too large (max 10MB)'
      });
    }

    const documentId = await uploadDocumentUseCase.execute({
      title: title || file.originalname,
      filename: file.originalname,
      mimeType: file.mimetype,
      fileBytes: file.buffer,
      ownerId
    });

    res.json({
      success: true,
      message: 'Document uploaded and processed successfully',
      documentId
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing document',
      error: error.message
    });
  }
});

/**
 * GET /api/rag/documents
 * Get all documents for a vendor
 */
router.get('/documents', async (req, res) => {
  try {
    const vendorId = req.user?.id || req.query.vendorId || 'default_vendor';

    const documents = await documentRepository.getDocumentsByVendor(vendorId);

    res.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving documents',
      error: error.message
    });
  }
});

/**
 * DELETE /api/rag/documents/:documentId
 * Delete a document and its embeddings
 */
router.delete('/documents/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const ownerId = req.user?.id || req.query.vendorId || 'default_vendor';

    // Verify ownership (optional - implement based on your auth system)
    const document = await documentRepository.getDocument(documentId);
    if (document.ownerId !== ownerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await vectorRepository.deleteDocument(documentId);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    });
  }
});

export default router;
