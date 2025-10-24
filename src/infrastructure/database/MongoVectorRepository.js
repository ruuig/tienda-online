// src/infrastructure/database/MongoVectorRepository.js
import VectorRepository from '../../domain/repositories/VectorRepository.js';
import mongoose from 'mongoose';

export class MongoVectorRepository extends VectorRepository {
  constructor() {
    super();
    this.chunksCollection = 'rag_document_chunks';
    this.embeddingsCollection = 'rag_document_embeddings';
  }

  async upsertEmbeddings(pairs) {
    try {
      const db = mongoose.connection.db;

      if (!db) {
        throw new Error('Database connection not available');
      }

      const collection = db.collection(this.embeddingsCollection);

      const bulkOps = pairs.map(([chunkId, embedding]) => ({
        updateOne: {
          filter: { chunkId: chunkId.toString() },
          update: {
            $set: {
              chunkId: chunkId.toString(),
              embedding: embedding,
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      }));

      if (bulkOps.length > 0) {
        await collection.bulkWrite(bulkOps);
      }

    } catch (error) {
      console.error('Error upserting embeddings:', error);
      throw error;
    }
  }

  async search(queryEmbedding, topK, documentId) {
    try {
      const db = mongoose.connection.db;

      if (!db) {
        throw new Error('Database connection not available');
      }

      // Obtener todos los chunks del documento con sus embeddings
      const chunks = await db.collection(this.chunksCollection)
        .find({ documentId: documentId.toString() })
        .toArray();

      if (chunks.length === 0) {
        return [];
      }

      // Obtener embeddings para estos chunks
      const chunkIds = chunks.map(chunk => chunk._id.toString());
      const embeddings = await db.collection(this.embeddingsCollection)
        .find({ chunkId: { $in: chunkIds } })
        .toArray();

      // Crear mapa de embeddings por chunkId
      const embeddingMap = new Map();
      embeddings.forEach(emb => {
        embeddingMap.set(emb.chunkId, emb.embedding);
      });

      // Calcular similitud coseno para cada chunk
      const scored = [];

      for (const chunk of chunks) {
        const embedding = embeddingMap.get(chunk._id.toString());

        if (embedding) {
          const similarity = this.cosineSimilarity(queryEmbedding, embedding);

          scored.push({
            chunk_id: chunk._id,
            document_id: chunk.documentId,
            chunk_index: chunk.chunkIndex,
            content: chunk.content,
            score: similarity
          });
        }
      }

      // Ordenar por similitud y retornar topK
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK);

    } catch (error) {
      console.error('Error searching vectors:', error);
      throw error;
    }
  }

  async deleteDocument(documentId) {
    try {
      const db = mongoose.connection.db;

      if (!db) {
        throw new Error('Database connection not available');
      }

      // Eliminar chunks del documento
      await db.collection(this.chunksCollection)
        .deleteMany({ documentId: documentId.toString() });

      // Eliminar embeddings de los chunks
      const chunks = await db.collection(this.chunksCollection)
        .find({ documentId: documentId.toString() })
        .toArray();

      if (chunks.length > 0) {
        const chunkIds = chunks.map(chunk => chunk._id.toString());
        await db.collection(this.embeddingsCollection)
          .deleteMany({ chunkId: { $in: chunkIds } });
      }

    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Calcula similitud coseno entre dos vectores
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
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
}
