// src/domain/services/LLMService.js
/**
 * Interface for LLM service
 */
export class LLMService {
  /**
   * Stream an answer using context chunks
   * @param {Object} options - Options object
   * @param {string} options.question - The user's question
   * @param {string[]} options.contextChunks - Relevant context chunks
   * @returns {AsyncIterable<string>} - Stream of tokens
   */
  async* streamAnswer({ question, contextChunks }) {
    throw new Error('Method streamAnswer must be implemented');
  }
}
