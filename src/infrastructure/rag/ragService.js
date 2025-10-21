// Sistema RAG (Retrieval-Augmented Generation) básico
// Esta implementación puede ser extendida con LangChain + FAISS después

export class RAGService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository;
    this.vectorStore = new Map(); // Para desarrollo - usar FAISS en producción
    this.embeddings = new Map(); // Para desarrollo - usar modelo de embeddings en producción
  }

  /**
   * Procesa documentos y crea índice de búsqueda
   * @param {Array} documents - Array de documentos a procesar
   */
  async buildIndex(documents) {
    try {
      console.log(`🔍 Construyendo índice RAG con ${documents.length} documentos...`);

      for (const doc of documents) {
        // Dividir documento en chunks (simplificado)
        const chunks = this.splitIntoChunks(doc.content, 500);

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];

          // Crear embedding básico (simplificado - usar modelo real en producción)
          const embedding = await this.generateEmbedding(chunk);

          // Almacenar en vector store
          const chunkId = `${doc._id}_${i}`;
          this.vectorStore.set(chunkId, {
            id: chunkId,
            content: chunk,
            documentId: doc._id,
            documentTitle: doc.title,
            metadata: {
              type: doc.type,
              category: doc.category,
              startIndex: i * 500,
              endIndex: (i * 500) + chunk.length
            }
          });

          this.embeddings.set(chunkId, embedding);
        }
      }

      console.log(`✅ Índice RAG construido. Total chunks: ${this.vectorStore.size}`);

    } catch (error) {
      console.error('Error construyendo índice RAG:', error);
      throw error;
    }
  }

  /**
   * Busca información relevante para una consulta
   * @param {string} query - Consulta del usuario
   * @param {number} limit - Número máximo de resultados
   * @returns {Promise<Array>} - Documentos relevantes ordenados por similitud
   */
  async search(query, limit = 3) {
    try {
      // Generar embedding de la consulta
      const queryEmbedding = await this.generateEmbedding(query);

      // Calcular similitud con todos los chunks
      const similarities = [];

      for (const [chunkId, chunkEmbedding] of this.embeddings.entries()) {
        const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);

        if (similarity > 0.1) { // Umbral mínimo de similitud
          similarities.push({
            chunkId,
            similarity,
            ...this.vectorStore.get(chunkId)
          });
        }
      }

      // Ordenar por similitud y limitar resultados
      const results = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      // Convertir a formato de documentos únicos
      const uniqueDocuments = this.deduplicateDocuments(results);

      return uniqueDocuments;

    } catch (error) {
      console.error('Error buscando en RAG:', error);
      return [];
    }
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
   * Genera embedding vectorial básico (simplificado)
   * En producción usar modelo de embeddings como OpenAI embeddings
   * @param {string} text - Texto para generar embedding
   * @returns {Promise<Array>} - Vector de embedding
   */
  async generateEmbedding(text) {
    // Implementación simplificada para desarrollo
    // En producción: return await openai.embeddings.create({ input: text, model: "text-embedding-ada-002" })

    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = {};

    // Contar frecuencia de palabras (simulación básica de embedding)
    words.forEach(word => {
      if (word.length > 2) { // Ignorar palabras muy cortas
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Crear vector de características básicas
    const embedding = new Array(100).fill(0);

    Object.entries(wordFreq).forEach(([word, freq], index) => {
      // Hash simple para asignar posición en el vector
      const hash = this.simpleHash(word);
      const position = hash % embedding.length;
      embedding[position] = Math.min(freq / 10, 1); // Normalizar
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
   * Elimina documentos duplicados manteniendo el más relevante
   * @param {Array} results - Resultados de búsqueda
   * @returns {Array} - Documentos únicos
   */
  deduplicateDocuments(results) {
    const uniqueDocs = new Map();

    results.forEach(result => {
      const docId = result.documentId;

      if (!uniqueDocs.has(docId)) {
        uniqueDocs.set(docId, {
          _id: docId,
          title: result.documentTitle,
          type: result.metadata.type,
          category: result.metadata.category,
          content: result.content,
          relevanceScore: result.similarity,
          chunks: [result]
        });
      } else {
        // Agregar chunk al documento existente si es más relevante
        const existing = uniqueDocs.get(docId);
        if (result.similarity > existing.relevanceScore) {
          existing.relevanceScore = result.similarity;
        }
        existing.chunks.push(result);
      }
    });

    return Array.from(uniqueDocs.values());
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

  /**
   * Reconstruye índice desde documentos en BD
   * @returns {Promise<void>}
   */
  async rebuildIndex() {
    try {
      const documents = await this.documentRepository.findAll({ isActive: true });

      if (documents.length === 0) {
        console.log('⚠️ No hay documentos activos para construir índice RAG');
        return;
      }

      // Limpiar índice actual
      this.vectorStore.clear();
      this.embeddings.clear();

      // Construir nuevo índice
      await this.buildIndex(documents);

    } catch (error) {
      console.error('Error reconstruyendo índice RAG:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas del sistema RAG
   * @returns {Object} - Estadísticas del índice
   */
  getStats() {
    return {
      totalDocuments: this.vectorStore.size,
      indexedChunks: this.vectorStore.size,
      memoryUsage: `${Math.round((JSON.stringify([...this.vectorStore.values()]).length / 1024))} KB`,
      lastUpdate: new Date().toISOString()
    };
  }
}

// Factory function para crear servicio RAG
export const createRAGService = (documentRepository) => {
  return new RAGService(documentRepository);
};
