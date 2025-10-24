// Entidad de dominio Document (no depende de infraestructura)
export class Document {
  constructor(id, title, content, type, category, tags, fileName, fileSize, mimeType, chunks, metadata, isActive, createdAt, updatedAt) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.type = type; // faq, manual, policy, guide, other
    this.category = category; // products, orders, account, shipping, returns, technical, other
    this.tags = tags || [];
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.mimeType = mimeType;
    this.chunks = chunks || []; // Para RAG - fragmentos del documento
    this.metadata = metadata || {};
    this.isActive = isActive !== undefined ? isActive : true;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Métodos de dominio
  addChunk(chunk) {
    this.chunks.push(chunk);
    this.updatedAt = new Date();
  }

  removeChunk(chunkIndex) {
    if (chunkIndex >= 0 && chunkIndex < this.chunks.length) {
      this.chunks.splice(chunkIndex, 1);
      this.updatedAt = new Date();
    }
  }

  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    this.updatedAt = new Date();
  }

  updateContent(newContent) {
    this.content = newContent;
    this.updatedAt = new Date();
    // Aquí se podrían regenerar los chunks si es necesario
  }

  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  // Buscar chunks relevantes para una consulta
  findRelevantChunks(query) {
    return this.chunks.filter(chunk =>
      chunk.content.toLowerCase().includes(query.toLowerCase())
    );
  }
}
