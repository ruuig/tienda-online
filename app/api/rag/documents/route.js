import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { DocumentRepositoryImpl } from '@/src/infrastructure/database/repositories';
import { RAGService } from '@/src/infrastructure/rag/ragService';

/**
 * GET /api/rag/documents
 * Get all documents for a vendor (implementación real)
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || 'default_vendor';

    const documentRepository = new DocumentRepositoryImpl();
    const documents = await documentRepository.findAll({
      isActive: true,
      vendorId: vendorId
    });

    // Calcular estadísticas
    const stats = {
      totalDocuments: documents.length,
      activeDocuments: documents.filter(doc => doc.isActive).length,
      totalSize: documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0)
    };

    return NextResponse.json({
      success: true,
      documents: documents || [],
      stats
    });

  } catch (error) {
    console.error('Error getting documents:', error);
    return NextResponse.json({
      success: false,
      message: 'Error retrieving documents',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/rag/documents
 * Upload a document for RAG processing (implementación real)
 */
export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const vendorId = formData.get('vendorId') || 'default_vendor';

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided'
      }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({
        success: false,
        message: 'Title is required'
      }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('text/')) {
      return NextResponse.json({
        success: false,
        message: 'Only text files (.txt) are supported'
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        message: 'File size too large (max 10MB)'
      }, { status: 400 });
    }

    // Extraer texto del archivo
    const extractedText = await file.text();

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: 'El archivo de texto está vacío o no se pudo leer'
      }, { status: 400 });
    }

    console.log(`📄 Texto extraído: ${extractedText.length} caracteres`);

    // Crear documento usando el repositorio real
    const documentRepository = new DocumentRepositoryImpl();
    const document = await documentRepository.create({
      vendorId: vendorId,
      title: title,
      content: extractedText, // Usar texto extraído real
      contentText: extractedText, // Para RAG
      type: 'other', // Tipo por defecto
      category: 'other', // Categoría por defecto
      fileName: file.name,
      fileSize: file.size,
      mimeType: 'text/plain',
      metadata: {
        uploadedBy: 'system',
        source: 'manual_upload',
        extractionMethod: 'text'
      },
      isActive: true
    });

    // Procesar con RAGService para generar embeddings
    const ragService = new RAGService(documentRepository);
    await ragService.rebuildIndex();

    return NextResponse.json({
      success: true,
      message: 'Document uploaded and processed successfully',
      documentId: document._id,
      note: 'Document has been processed with RAG embeddings',
      extractedText: extractedText.substring(0, 200) + '...' // Mostrar preview del texto extraído
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing document',
      error: error.message
    }, { status: 500 });
  }
}
