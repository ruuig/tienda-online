// src/application/useCases/AskQuestionUseCase.js
import { RAGService } from '../../infrastructure/rag/ragService.js';

/**
 * Caso de uso para procesar preguntas usando RAG (Retrieval-Augmented Generation)
 */
export class AskQuestionUseCase {
  constructor(vectorRepository, embeddingsService, llmService, productContextService) {
    this.vectorRepository = vectorRepository;
    this.embeddingsService = embeddingsService;
    this.llmService = llmService;
    this.productContextService = productContextService;
    this.ragService = new RAGService(null); // Usaremos el repositorio de documentos del contexto
  }

  /**
   * Procesa una pregunta y devuelve una respuesta en streaming
   * @param {Object} options - Opciones de la consulta
   * @param {string} options.question - Pregunta del usuario
   * @param {string} options.documentId - ID del documento específico (opcional)
   * @param {string} options.vendorId - ID del vendedor
   * @returns {AsyncIterable<string>} - Stream de tokens de respuesta
   */
  async* stream({ question, documentId, vendorId }) {
    try {
      console.log(`🤖 Procesando pregunta: "${question.substring(0, 100)}..."`);

      // 1. Generar contexto de productos y tienda
      const context = await this.productContextService.generateContext(question);
      console.log(`📝 Contexto generado: ${context.length} caracteres`);

      // 2. Buscar información relevante usando RAG
      let relevantDocuments = [];

      if (documentId) {
        // Si se especifica un documento, buscar en él
        const documents = await this.productContextService.getDocumentsForVendor(vendorId);
        const targetDoc = documents.find(doc => doc._id === documentId);

        if (targetDoc) {
          // Buscar chunks relevantes en el documento específico
          const chunks = await this.searchInDocument(question, targetDoc);
          relevantDocuments = chunks.map(chunk => ({
            title: targetDoc.title,
            content: chunk.content,
            category: targetDoc.category,
            type: targetDoc.type,
            relevanceScore: chunk.similarity
          }));
        }
      } else {
        // Buscar en todos los documentos disponibles
        const documents = await this.productContextService.getDocumentsForVendor(vendorId);
        relevantDocuments = await this.searchInAllDocuments(question, documents);
      }

      console.log(`🔍 Documentos relevantes encontrados: ${relevantDocuments.length}`);

      // 3. Si no se encontraron documentos relevantes, usar solo el contexto de la tienda
      if (relevantDocuments.length === 0) {
        console.log('⚠️ No se encontraron documentos relevantes, usando solo contexto de tienda');
        relevantDocuments = [{
          title: 'Información de RJG Tech Shop',
          content: context,
          category: 'company',
          type: 'information',
          relevanceScore: 1.0
        }];
      }

      // 4. Generar respuesta usando el LLM con contexto
      const systemMessage = this.buildSystemMessage(context);
      const userMessage = this.buildUserMessage(question, relevantDocuments);

      console.log('🚀 Generando respuesta con OpenAI...');

      // Usar el LLM service para generar la respuesta
      yield* this.llmService.streamAnswer({
        question: userMessage,
        contextChunks: [systemMessage, ...relevantDocuments.map(doc => doc.content)]
      });

    } catch (error) {
      console.error('❌ Error en AskQuestionUseCase:', error);
      yield 'Lo siento, estoy teniendo problemas para procesar tu consulta. ¿Podrías intentar de nuevo?';
    }
  }

  /**
   * Busca información relevante en un documento específico
   * @param {string} question - Pregunta del usuario
   * @param {Object} document - Documento objetivo
   * @returns {Promise<Array>} - Chunks relevantes
   */
  async searchInDocument(question, document) {
    try {
      // Dividir el contenido del documento en chunks
      const chunks = this.splitIntoChunks(document.content, 500);

      // Generar embedding de la consulta
      const queryEmbedding = await this.embeddingsService.embedQuery(question);

      // Calcular similitud con cada chunk
      const scoredChunks = chunks.map((chunk, index) => {
        const chunkEmbedding = this.generateSimpleEmbedding(chunk);
        const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);

        return {
          content: chunk,
          similarity: similarity,
          index: index
        };
      });

      // Retornar chunks más relevantes
      return scoredChunks
        .filter(chunk => chunk.similarity > 0.1)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);

    } catch (error) {
      console.error('Error searching in document:', error);
      return [];
    }
  }

  /**
   * Busca información relevante en todos los documentos
   * @param {string} question - Pregunta del usuario
   * @param {Array} documents - Array de documentos
   * @returns {Promise<Array>} - Documentos relevantes
   */
  async searchInAllDocuments(question, documents) {
    try {
      const results = [];

      for (const document of documents) {
        const relevantChunks = await this.searchInDocument(question, document);

        if (relevantChunks.length > 0) {
          results.push({
            title: document.title,
            content: relevantChunks[0].content, // Tomar el chunk más relevante
            category: document.category,
            type: document.type,
            relevanceScore: relevantChunks[0].similarity
          });
        }
      }

      return results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3);

    } catch (error) {
      console.error('Error searching in all documents:', error);
      return [];
    }
  }

  /**
   * Construye el mensaje del sistema con instrucciones
   * @param {string} context - Contexto de la tienda
   * @returns {Object} - Mensaje del sistema
   */
  buildSystemMessage(context) {
    return {
      role: 'system',
      content: `Eres un asistente de atención al cliente para RJG Tech Shop.

INSTRUCCIONES CRÍTICAS:
- Responde ÚNICAMENTE sobre productos, servicios y procesos de RJG Tech Shop
- Sé amable, profesional y servicial en todo momento
- NUNCA hagas bromas, chistes o comentarios informales
- Evita respuestas especulativas o información falsa
- Siempre responde en español de manera clara y concisa
- Usa el contexto proporcionado para dar respuestas precisas

CONTEXTO DE RJG TECH SHOP:
${context}

REGLAS DE RESPUESTA:
- Proporciona información precisa sobre productos y precios en Quetzales (Q)
- Sugiere visitar la página web para detalles completos
- Ofrece alternativas similares cuando sea apropiado
- Mantén un tono profesional: "¡Hola! 😊 Gracias por comunicarte con RJG Tech Shop. Con gusto te ayudo..."

Responde de manera útil y orientada al cliente, usando la información proporcionada.`
    };
  }

  /**
   * Construye el mensaje del usuario con contexto relevante
   * @param {string} question - Pregunta del usuario
   * @param {Array} relevantDocuments - Documentos relevantes
   * @returns {Object} - Mensaje del usuario
   */
  buildUserMessage(question, relevantDocuments) {
    let contextInfo = '';

    if (relevantDocuments.length > 0) {
      contextInfo = `\n\nINFORMACIÓN RELEVANTE ENCONTRADA:\n`;
      relevantDocuments.forEach((doc, index) => {
        contextInfo += `[${index + 1}] ${doc.title}:\n${doc.content.substring(0, 300)}...\n\n`;
      });
    }

    return `Pregunta del cliente: ${question}${contextInfo}

Por favor, responde usando la información proporcionada sobre RJG Tech Shop. Mantén un tono profesional y servicial.`;
  }

  /**
   * Divide texto en chunks de tamaño específico
   * @param {string} text - Texto a dividir
   * @param {number} chunkSize - Tamaño de cada chunk
   * @returns {Array} - Array de chunks
   */
  splitIntoChunks(text, chunkSize = 500) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/); // Dividir por oraciones

    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();

      if (!trimmedSentence) continue;

      // Si agregar esta oración excede el límite, crear nuevo chunk
      if ((currentChunk + trimmedSentence).length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence + '. ';
      } else {
        currentChunk += trimmedSentence + '. ';
      }
    }

    // Agregar último chunk si existe
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Genera embedding vectorial básico (fallback)
   * @param {string} text - Texto para generar embedding
   * @returns {Array} - Vector de embedding
   */
  generateSimpleEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = {};

    // Contar frecuencia de palabras
    words.forEach(word => {
      if (word.length > 2) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Crear vector de características básicas
    const embedding = new Array(100).fill(0);

    Object.entries(wordFreq).forEach(([word, freq], index) => {
      const hash = this.simpleHash(word);
      const position = hash % embedding.length;
      embedding[position] = Math.min(freq / 10, 1);
    });

    return embedding;
  }

  /**
   * Calcula similitud coseno entre dos vectores
   * @param {Array} vecA - Primer vector
   * @param {Array} vecB - Segundo vector
   * @returns {number} - Similitud (0-1)
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Los vectores deben tener la misma dimensión');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Hash simple para asignar posiciones en vectores
   * @param {string} str - String para hashear
   * @returns {number} - Hash numérico
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit
    }
    return Math.abs(hash);
  }
}
