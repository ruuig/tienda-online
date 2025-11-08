// src/infrastructure/embeddings/OpenAIEmbeddingsService.js
import { EmbeddingsService } from '../../domain/services/EmbeddingsService.js';
import OpenAI from 'openai';

export class OpenAIEmbeddingsService extends EmbeddingsService {
  constructor() {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = 'text-embedding-3-small';
  }

  async embed(texts) {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
        encoding_format: 'float'
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  async embedQuery(text) {
    const embeddings = await this.embed([text]);
    return embeddings[0];
  }
}
