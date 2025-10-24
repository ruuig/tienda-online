// src/domain/repositories/VectorRepository.js
/**
 * Interface for vector repository
 */
export default class VectorRepository {
  /**
   * Upsert embeddings
   * @param {Array} pairs - Array of [chunkId, embedding] pairs
   * @returns {Promise<void>}
   */
  async upsertEmbeddings(pairs) {
    throw new Error('Method upsertEmbeddings must be implemented');
  }

  /**
   * Search for similar vectors
   * @param {number[]} queryEmbedding - Query embedding vector
   * @param {number} topK - Number of results to return
   * @param {string} documentId - Document ID to search in
   * @returns {Promise<Array>} - Array of search results with scores
   */
  async search(queryEmbedding, topK, documentId) {
    throw new Error('Method search must be implemented');
  }

  /**
   * Delete document and all its chunks
   * @param {string} documentId - Document ID
   * @returns {Promise<void>}
   */
  async deleteDocument(documentId) {
    throw new Error('Method deleteDocument must be implemented');
  }
}
