// src/infrastructure/llm/OpenAILLMService.js
import { LLMService } from '../../domain/services/LLMService.js';
import OpenAI from 'openai';

export class OpenAILLMService extends LLMService {
  constructor() {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = 'gpt-4o-mini'; // Modelo rápido como en el original
  }

  async* streamAnswer({ question, contextChunks }) {
    try {
      const context = contextChunks.join('\n\n');
      const systemMessage = `Eres un asistente que SOLO responde usando el contexto proporcionado.
Si la respuesta no está en el contexto, responde exactamente:
"No poseo información sobre ese temaaaaa en el documento cargado."`;

      const userMessage = `Pregunta: ${question}

Contexto:
${context}`;

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        stream: true,
        temperature: 0.1
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield delta.content;
        }
      }
    } catch (error) {
      console.error('Error streaming answer:', error);
      throw error;
    }
  }
}
