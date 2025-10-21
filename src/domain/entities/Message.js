// Entidad de dominio Message (no depende de infraestructura)
export class Message {
  constructor(id, conversationId, content, sender, type, metadata, isRead, readBy, createdAt) {
    this.id = id;
    this.conversationId = conversationId;
    this.content = content;
    this.sender = sender; // user, bot, admin
    this.type = type; // text, image, file, system
    this.metadata = metadata || {};
    this.isRead = isRead || false;
    this.readBy = readBy || [];
    this.createdAt = createdAt;
  }

  // Métodos de dominio
  markAsRead(userId) {
    if (!this.isRead) {
      this.isRead = true;
      this.readBy.push({
        userId,
        readAt: new Date()
      });
    }
  }

  updateContent(newContent) {
    this.content = newContent;
  }

  addMetadata(key, value) {
    this.metadata[key] = value;
  }

  // Verificar si un usuario específico ya leyó el mensaje
  isReadBy(userId) {
    return this.readBy.some(read => read.userId === userId);
  }
}
