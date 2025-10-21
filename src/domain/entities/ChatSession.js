// Entidad de dominio ChatSession (no depende de infraestructura)
export class ChatSession {
  constructor(id, conversationId, userId, socketId, isActive, connectedAt, lastActivity, metadata) {
    this.id = id;
    this.conversationId = conversationId;
    this.userId = userId;
    this.socketId = socketId;
    this.isActive = isActive !== undefined ? isActive : true;
    this.connectedAt = connectedAt;
    this.lastActivity = lastActivity;
    this.metadata = metadata || {};
  }

  // Métodos de dominio
  updateLastActivity() {
    this.lastActivity = new Date();
  }

  disconnect() {
    this.isActive = false;
  }

  reconnect(newSocketId) {
    this.socketId = newSocketId;
    this.isActive = true;
    this.connectedAt = new Date();
    this.lastActivity = new Date();
  }

  updateMetadata(newMetadata) {
    this.metadata = { ...this.metadata, ...newMetadata };
  }

  // Verificar si la sesión está activa
  isConnected() {
    return this.isActive && this.socketId;
  }

  // Obtener tiempo de actividad en minutos
  getActiveTimeMinutes() {
    if (!this.connectedAt) return 0;
    return Math.floor((new Date() - this.connectedAt) / (1000 * 60));
  }
}
