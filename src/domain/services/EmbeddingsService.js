// src/domain/services/EmbeddingsService.js
/**
 * Interface for embeddings service
 */
export class EmbeddingsService {
  /**
   * Generate embeddings for multiple texts
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<number[][]>} - Array of embedding vectors
   */
  async embed(texts) {
    throw new Error('Method embed must be implemented');
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async embedQuery(text) {
    throw new Error('Method embedQuery must be implemented');
  }
}
