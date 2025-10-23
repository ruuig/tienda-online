// Servicio RAG simplificado sin dependencias de LangChain
import { OpenAI } from 'openai';
import path from 'path';

export class SimpleRAGService {
  constructor(openaiApiKey) {
    if (!openaiApiKey || typeof openaiApiKey !== 'string' || openaiApiKey.trim() === '') {
      throw new Error('Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.');
    }

    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.vectorStores = new Map(); // vendorId -> embeddings
    this.documents = new Map(); // documentId -> document data
    this.initialized = false;
  }

  /**
   * Inicializa el servicio RAG para un vendedor específico
   */
  async initializeForVendor(vendorId) {
    try {
      console.log(`SimpleRAGService: Inicializando para vendor ${vendorId}...`);
      this.initialized = true;
      console.log(`SimpleRAGService: Inicializado para vendor ${vendorId}`);
      return true;
    } catch (error) {
      console.error(`SimpleRAGService: Error inicializando para vendor ${vendorId}:`, error);
      return false;
    }
  }

  /**
   * Busca información relevante usando embeddings de OpenAI
   */
  async searchRelevantContext(query, vendorId, options = {}) {
    try {
      const vendorIdStr = vendorId.toString();

      if (!this.documents.has(vendorIdStr)) {
        return {
          context: '',
          sources: [],
          relevanceScore: 0
        };
      }

      const vendorDocs = this.documents.get(vendorIdStr);
      const {
        k = 3,
        scoreThreshold = 0.7
      } = options;

      // Crear embedding de la consulta
      const queryEmbedding = await this.createEmbedding(query);

      // Calcular similitud con documentos
      const similarities = [];

      for (const [docId, docData] of vendorDocs.entries()) {
        const similarity = this.cosineSimilarity(queryEmbedding, docData.embedding);

        if (similarity >= scoreThreshold) {
          similarities.push({
            documentId: docId,
            similarity,
            content: docData.content
          });
        }
      }

      // Ordenar por similitud y limitar resultados
      const results = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k);

      if (results.length === 0) {
        return {
          context: '',
          sources: [],
          relevanceScore: 0
        };
      }

      // Construir contexto
      let context = '';
      const sources = [];

      for (const result of results) {
        context += result.content + '\n\n';
        sources.push({
          documentId: result.documentId,
          relevanceScore: result.similarity,
          contentSnippet: result.content.substring(0, 200)
        });
      }

      const maxRelevanceScore = Math.max(...results.map(r => r.similarity));

      return {
        context: context.trim(),
        sources,
        relevanceScore: maxRelevanceScore,
        resultsCount: results.length
      };

    } catch (error) {
      console.error('SimpleRAGService: Error en búsqueda:', error);
      return {
        context: '',
        sources: [],
        relevanceScore: 0,
        error: error.message
      };
    }
  }

  /**
   * Agrega un documento al sistema RAG
   */
  async addDocument(documentId, vendorId, content) {
    try {
      const vendorIdStr = vendorId.toString();

      if (!this.documents.has(vendorIdStr)) {
        this.documents.set(vendorIdStr, new Map());
      }

      const vendorDocs = this.documents.get(vendorIdStr);

      // Crear embedding del contenido
      const embedding = await this.createEmbedding(content);

      // Guardar documento
      vendorDocs.set(documentId, {
        content,
        embedding,
        addedAt: new Date()
      });

      console.log(`SimpleRAGService: Documento ${documentId} agregado para vendor ${vendorIdStr}`);

      return {
        success: true,
        embeddingLength: embedding.length
      };

    } catch (error) {
      console.error(`SimpleRAGService: Error agregando documento ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Crea embedding usando OpenAI directamente
   */
  async createEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creando embedding:', error);
      throw error;
    }
  }

  /**
   * Calcula similitud coseno entre dos vectores
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
   * Obtiene estadísticas del servicio RAG
   * @returns {Object} - Estadísticas del servicio
   */
  getStats() {
    return {
      documentsCount: this.documents.size,
      vendorStoresCount: Array.from(this.documents.values()).reduce((total, vendorDocs) => total + vendorDocs.size, 0),
      initialized: this.initialized,
      vectorStoresCount: this.vectorStores.size
    };
  }

  /**
   * Limpia recursos del servicio
   */
  async cleanup() {
    console.log('SimpleRAGService: Limpiando recursos...');
    this.documents.clear();
    this.initialized = false;
    console.log('SimpleRAGService: Limpieza completada');
  }

}
export const createSimpleRAGService = (openaiApiKey) => {
  return new SimpleRAGService(openaiApiKey);
};
