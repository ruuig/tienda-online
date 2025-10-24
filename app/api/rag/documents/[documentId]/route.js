// app/api/rag/documents/[documentId]/route.js
import { NextResponse } from 'next/server';
import { MongoDocumentRepository } from '../../../../src/infrastructure/database/MongoDocumentRepository.js';
import { MongoVectorRepository } from '../../../../src/infrastructure/database/MongoVectorRepository.js';
import { getAuth } from '@clerk/nextjs/server';

const documentRepository = new MongoDocumentRepository();
const vectorRepository = new MongoVectorRepository();

/**
 * DELETE /api/rag/documents/[documentId]
 * Delete a document and its embeddings
 */
export async function DELETE(request, { params }) {
  try {
    const { userId, user } = getAuth(request);
    const { documentId } = params;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || user?.publicMetadata?.vendorId || 'default_vendor';

    // Verify ownership
    const document = await documentRepository.getDocument(documentId);
    if (document.ownerId !== vendorId) {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 });
    }

    await vectorRepository.deleteDocument(documentId);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    }, { status: 500 });
  }
}
