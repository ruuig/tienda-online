// Sistema RAG (Retrieval-Augmented Generation) con persistencia de índice

export class RAGService {
  constructor(documentRepository, options = {}) {
    this.documentRepository = documentRepository;
    this.options = {
      chunkSize: options.chunkSize || 500,
      minSimilarity: options.minSimilarity ?? 0.1,
    };

    this.defaultVendorId =
      options.defaultVendorId ||
      process.env.DEFAULT_VENDOR_ID ||
      process.env.NEXT_PUBLIC_VENDOR_ID ||
      'default_vendor';

    this.indices = new Map();
    this.vectorStore = new Map();
    this.embeddings = new Map();
  }

  static chunkText(text, chunkSize = 500, overlap = 0) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const sanitizedOverlap = Math.max(0, Math.min(overlap, chunkSize - 1));
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const segment = text.slice(start, end);
      chunks.push({
        content: segment.trim(),
        chunkIndex: chunks.length,
        tokenCount: segment.length,
        startIndex: start,
        endIndex: end,
      });
      if (end === text.length) break;
      start = end - sanitizedOverlap;
    }

    return chunks.filter(chunk => !!chunk.content);
  }

  getVendorKey(vendorId = null) {
    return vendorId || this.defaultVendorId || 'default_vendor';
  }

  createEmptyIndex(vendorKey) {
    return {
      vendorId: vendorKey,
      vectorStore: new Map(),
      embeddings: new Map(),
      documents: new Map(),
      chunkCount: 0,
      documentCount: 0,
      loaded: false,
      lastUpdated: null,
    };
  }

  documentToPlain(document) {
    if (!document) return document;
    if (typeof document.toObject === 'function') {
      return document.toObject({ depopulate: true, versionKey: false });
    }
    if (document instanceof Map) {
      return Object.fromEntries(document.entries());
    }
    if (typeof document === 'object') {
      return JSON.parse(JSON.stringify(document));
    }
    return document;
  }

  normalizeEmbedding(rawEmbedding) {
    if (!rawEmbedding) return [];
    if (Array.isArray(rawEmbedding)) return rawEmbedding;
    if (typeof rawEmbedding === 'object' && Array.isArray(rawEmbedding.values)) {
      return rawEmbedding.values;
    }
    return [];
  }

  documentNeedsReindex(document) {
    if (!document) return true;
    const chunks = Array.isArray(document.chunks) ? document.chunks : [];
    if (chunks.length === 0) return true;

    const hasEmbeddings = chunks.every(chunk => {
      const embedding = this.normalizeEmbedding(chunk.embedding);
      return Array.isArray(embedding) && embedding.length > 0;
    });

    if (!hasEmbeddings) return true;

    if (document.lastIndexed && document.updatedAt) {
      const updatedAt = new Date(document.updatedAt).getTime();
      const lastIndexed = new Date(document.lastIndexed).getTime();

      if (!Number.isNaN(updatedAt) && !Number.isNaN(lastIndexed)) {
        if (updatedAt - lastIndexed > 500) {
          return true;
        }
      }
    }

    return false;
  }

  replaceIndexForVendor(documents, vendorKey) {
    const index = this.createEmptyIndex(vendorKey);

    documents.forEach(doc => this.addDocumentToIndex(index, doc));

    index.loaded = true;
    index.lastUpdated = new Date();
    index.chunkCount = index.embeddings.size;
    index.documentCount = index.documents.size;

    this.indices.set(vendorKey, index);

    if (vendorKey === this.getVendorKey()) {
      this.vectorStore = index.vectorStore;
      this.embeddings = index.embeddings;
    }

    return index;
  }

  upsertDocumentsIntoIndex(documents, vendorKey) {
    const existingIndex = this.indices.get(vendorKey) || this.createEmptyIndex(vendorKey);

    documents.forEach(doc => this.addDocumentToIndex(existingIndex, doc));

    existingIndex.loaded = true;
    existingIndex.lastUpdated = new Date();
    existingIndex.chunkCount = existingIndex.embeddings.size;
    existingIndex.documentCount = existingIndex.documents.size;

    this.indices.set(vendorKey, existingIndex);

    if (vendorKey === this.getVendorKey()) {
      this.vectorStore = existingIndex.vectorStore;
      this.embeddings = existingIndex.embeddings;
    }

    return existingIndex;
  }

  addDocumentToIndex(index, rawDocument) {
    if (!rawDocument) return;

    const document = this.documentToPlain(rawDocument);
    const docId = (document._id || document.id || '').toString();
    if (!docId) return;

    const existing = index.documents.get(docId);
    if (existing) {
      existing.chunks?.forEach(chunk => {
        index.vectorStore.delete(chunk.id);
        index.embeddings.delete(chunk.id);
      });
    }

    const chunks = Array.isArray(document.chunks) ? document.chunks : [];
    const chunkEntries = chunks.map((chunk, idx) => {
      const chunkId = `${docId}_${idx}`;
      const content = chunk.content || chunk.chunkText || '';
      const embedding = this.normalizeEmbedding(chunk.embedding);
      const startIndex = chunk.startIndex ?? idx * this.options.chunkSize;
      const endIndex = chunk.endIndex ?? startIndex + content.length;

      const entry = {
        id: chunkId,
        content,
        documentId: docId,
        documentTitle: document.title,
        metadata: {
          type: document.type,
          category: document.category,
          startIndex,
          endIndex,
        },
      };

      index.vectorStore.set(chunkId, entry);

      if (embedding.length > 0) {
        index.embeddings.set(chunkId, embedding);
      }

      return {
        ...entry,
        embedding,
      };
    });

    index.documents.set(docId, {
      _id: docId,
      id: docId,
      title: document.title,
      type: document.type,
      category: document.category,
      metadata: document.metadata || {},
      content: document.content || document.contentText || '',
      relevanceScore: 0,
      chunks: chunkEntries,
      vendorId: document.vendorId || null,
      lastIndexed: document.lastIndexed || null,
    });
  }

  async ensureIndexLoaded({ vendorId = null, force = false } = {}) {
    const vendorKey = this.getVendorKey(vendorId);
    const existing = this.indices.get(vendorKey);

    if (!force && existing?.loaded) {
      return existing;
    }

    if (!this.documentRepository || typeof this.documentRepository.findAll !== 'function') {
      return existing || this.createEmptyIndex(vendorKey);
    }

    const filters = { isActive: true };
    if (vendorId) {
      filters.vendorId = vendorId;
    }

    const repositoryDocuments = await this.documentRepository.findAll(filters);
    const plainDocuments = repositoryDocuments.map(doc => this.documentToPlain(doc));

    if (force) {
      await this.buildIndex(plainDocuments, {
        vendorId,
        replaceExisting: true,
      });
      return this.indices.get(vendorKey);
    }

    const readyDocuments = [];
    const documentsToReindex = [];

    plainDocuments.forEach(document => {
      if (this.documentNeedsReindex(document)) {
        documentsToReindex.push(document);
      } else {
        readyDocuments.push(document);
      }
    });

    if (documentsToReindex.length > 0) {
      const indexedDocuments = await this.buildIndex(documentsToReindex, {
        vendorId,
        replaceExisting: false,
        updateMemory: false,
      });
      readyDocuments.push(...indexedDocuments);
    }

    return this.replaceIndexForVendor(readyDocuments, vendorKey);
  }

  /**
   * Procesa documentos y crea índice de búsqueda
   * @param {Array} documents - Array de documentos a procesar
   */
  async buildIndex(documents, options = {}) {
    try {
      if (!Array.isArray(documents) || documents.length === 0) {
        return [];
      }

      const vendorId = options.vendorId || documents[0]?.vendorId || null;
      const vendorKey = this.getVendorKey(vendorId);
      const chunkSize = options.chunkSize || this.options.chunkSize;
      const processedDocuments = [];

      console.log(`Construyendo índice RAG con ${documents.length} documentos...`);

      for (const rawDocument of documents) {
        const document = this.documentToPlain(rawDocument);
        const docId = document._id || document.id;
        if (!docId) continue;

        const content = document.content || document.contentText || '';
        if (!content) continue;

        const chunkTexts = this.splitIntoChunks(content, chunkSize);
        const indexedAt = new Date();
        const chunkRecords = [];

        for (let i = 0; i < chunkTexts.length; i++) {
          const chunk = chunkTexts[i];
          const embedding = await this.generateEmbedding(chunk);
          const startIndex = i * chunkSize;
          const endIndex = startIndex + chunk.length;

          chunkRecords.push({
            content: chunk,
            embedding,
            startIndex,
            endIndex,
          });
        }

        if (this.documentRepository && typeof this.documentRepository.update === 'function') {
          await this.documentRepository.update(docId, {
            chunks: chunkRecords.map(({ content, embedding, startIndex, endIndex }) => ({
              content,
              embedding,
              startIndex,
              endIndex,
            })),
            lastIndexed: indexedAt,
          });
        }

        processedDocuments.push({
          ...document,
          chunks: chunkRecords,
          lastIndexed: indexedAt,
        });
      }

      if (options.updateMemory === false) {
        return processedDocuments;
      }

      if (options.replaceExisting) {
        this.replaceIndexForVendor(processedDocuments, vendorKey);
      } else {
        this.upsertDocumentsIntoIndex(processedDocuments, vendorKey);
      }

      const index = this.indices.get(vendorKey);
      console.log(`✅ Índice RAG actualizado. Total chunks: ${index?.chunkCount || 0}`);

      return processedDocuments;
    } catch (error) {
      console.error('Error construyendo índice RAG:', error);
      throw error;
    }
  }

  /**
   * Busca información relevante para una consulta
   * @param {string} query - Consulta del usuario
   * @param {number|Object} limitOrOptions - Opciones de búsqueda
   * @returns {Promise<Array>} - Documentos relevantes ordenados por similitud
   */
  async search(query, limitOrOptions = {}) {
    try {
      let limit = 3;
      let vendorId = null;
      let minSimilarity = this.options.minSimilarity;

      if (typeof limitOrOptions === 'number') {
        limit = limitOrOptions;
      } else if (typeof limitOrOptions === 'object' && limitOrOptions !== null) {
        limit = limitOrOptions.limit ?? limit;
        vendorId = limitOrOptions.vendorId ?? null;
        if (typeof limitOrOptions.minSimilarity === 'number') {
          minSimilarity = limitOrOptions.minSimilarity;
        }
      }

      const index = await this.ensureIndexLoaded({ vendorId });

      if (!index || index.embeddings.size === 0) {
        return [];
      }

      const queryEmbedding = await this.generateEmbedding(query);

      const similarities = [];

      for (const [chunkId, chunkEmbedding] of index.embeddings.entries()) {
        const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);

        if (similarity >= minSimilarity) {
          const chunkInfo = index.vectorStore.get(chunkId);
          if (!chunkInfo) continue;
          similarities.push({
            chunkId,
            similarity,
            ...chunkInfo,
          });
        }
      }

      const results = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      const uniqueDocuments = this.deduplicateDocuments(results, index);

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
  splitIntoChunks(text, chunkSize = this.options.chunkSize) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/);

    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();

      if (!trimmedSentence) continue;

      if ((currentChunk + trimmedSentence).length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = `${trimmedSentence}. `;
      } else {
        currentChunk += `${trimmedSentence}. `;
      }
    }

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
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = {};

    words.forEach(word => {
      if (word.length > 2) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    const embedding = new Array(100).fill(0);

    Object.entries(wordFreq).forEach(([word, freq]) => {
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
   * Elimina documentos duplicados manteniendo el más relevante
   * @param {Array} results - Resultados de búsqueda
   * @param {Object} index - Índice del proveedor
   * @returns {Array} - Documentos únicos
   */
  deduplicateDocuments(results, index) {
    const uniqueDocs = new Map();

    results.forEach(result => {
      const docId = result.documentId;

      if (!uniqueDocs.has(docId)) {
        const storedDoc = index.documents.get(docId) || {};
        uniqueDocs.set(docId, {
          _id: docId,
          title: result.documentTitle,
          type: result.metadata.type,
          category: result.metadata.category,
          content: result.content,
          relevanceScore: result.similarity,
          metadata: storedDoc.metadata || {},
          vendorId: storedDoc.vendorId || null,
          chunks: [result],
        });
      } else {
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
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Reconstruye índice desde documentos en BD
   * @returns {Promise<Object>}
   */
  async rebuildIndex(options = {}) {
    try {
      if (!this.documentRepository || typeof this.documentRepository.findAll !== 'function') {
        return { documentsIndexed: 0, chunksIndexed: 0 };
      }

      const { vendorId = null } = options;
      const filters = { isActive: true };
      if (vendorId) {
        filters.vendorId = vendorId;
      }

      const documents = await this.documentRepository.findAll(filters);

      if (documents.length === 0) {
        console.log('⚠️ No hay documentos activos para construir índice RAG');
        const vendorKey = this.getVendorKey(vendorId);
        this.indices.set(vendorKey, this.createEmptyIndex(vendorKey));
        return { documentsIndexed: 0, chunksIndexed: 0 };
      }

      const processed = await this.buildIndex(documents, {
        vendorId,
        replaceExisting: true,
      });

      const chunkCount = processed.reduce((total, doc) => {
        const docChunks = Array.isArray(doc.chunks) ? doc.chunks.length : 0;
        return total + docChunks;
      }, 0);

      return {
        documentsIndexed: processed.length,
        chunksIndexed: chunkCount,
      };

    } catch (error) {
      console.error('Error reconstruyendo índice RAG:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas del sistema RAG
   * @returns {Object} - Estadísticas del índice
   */
  getStats(options = {}) {
    const vendorKey = this.getVendorKey(options.vendorId);
    const index = this.indices.get(vendorKey);

    if (!index) {
      return {
        vendorId: vendorKey,
        totalDocuments: 0,
        indexedChunks: 0,
        memoryUsage: '0 KB',
        lastUpdate: null,
        isLoaded: false,
        persisted: true,
      };
    }

    return {
      vendorId: vendorKey,
      totalDocuments: index.documentCount,
      indexedChunks: index.chunkCount,
      memoryUsage: `${Math.round((JSON.stringify([...index.vectorStore.values()]).length / 1024))} KB`,
      lastUpdate: index.lastUpdated ? index.lastUpdated.toISOString() : null,
      isLoaded: !!index.loaded,
      persisted: true,
    };
  }

  getIndexedDocuments(vendorId = null) {
    const vendorKey = this.getVendorKey(vendorId);
    const index = this.indices.get(vendorKey);

    if (!index) return [];

    return Array.from(index.documents.values()).map(document => ({
      _id: document._id,
      id: document.id,
      title: document.title,
      type: document.type,
      category: document.category,
      metadata: document.metadata,
      vendorId: document.vendorId,
      content: document.content,
      chunks: (document.chunks || []).map(chunk => ({
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: chunk.embedding,
      })),
    }));
  }
}

// Factory function para crear servicio RAG
export const createRAGService = (documentRepository, options = {}) => {
  return new RAGService(documentRepository, options);
};
