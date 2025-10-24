// src/domain/entities/DocumentChunk.js
/**
 * Document chunk entity for RAG system
 */
export class DocumentChunk {
  constructor({ id, documentId, chunkIndex, content, embedding, createdAt }) {
    this.id = id;
    this.documentId = documentId;
    this.chunkIndex = chunkIndex;
    this.content = content;
    this.embedding = embedding;
    this.createdAt = createdAt;
  }

  /**
   * Create chunk from database row
   * @param {Object} row - Database row
   * @returns {DocumentChunk} - DocumentChunk instance
   */
  static fromDatabaseRow(row) {
    return new DocumentChunk({
      id: row.id,
      documentId: row.document_id,
      chunkIndex: row.chunk_index,
      content: row.content,
      embedding: row.embedding,
      createdAt: row.created_at
    });
  }
}
