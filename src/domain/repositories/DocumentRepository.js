// src/domain/repositories/DocumentRepository.js
/**
 * Interface for document repository
 */
export class DocumentRepository {
  /**
   * Save a document
   * @param {Object} options - Options object
   * @param {string} options.title - Document title
   * @param {string} options.filename - Original filename
   * @param {string} options.mimeType - MIME type
   * @param {Buffer} options.fileBytes - File content as bytes
   * @param {string} options.ownerId - Owner ID
   * @returns {Promise<string>} - Document ID
   */
  async saveDocument({ title, filename, mimeType, fileBytes, ownerId }) {
    throw new Error('Method saveDocument must be implemented');
  }

  /**
   * Add chunks to a document
   * @param {string} documentId - Document ID
   * @param {Array} chunks - Array of chunks
   * @returns {Promise<string[]>} - Array of chunk IDs
   */
  async addChunks(documentId, chunks) {
    throw new Error('Method addChunks must be implemented');
  }

  /**
   * Get document by ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} - Document object
   */
  async getDocument(documentId) {
    throw new Error('Method getDocument must be implemented');
  }

  /**
   * Get all documents for a vendor
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Array>} - Array of documents
   */
  async getDocumentsByVendor(vendorId) {
    throw new Error('Method getDocumentsByVendor must be implemented');
  }
}
