// Entidad de dominio Conversation (no depende de infraestructura)
export class Conversation {
  constructor(id, userId, title, status, priority, assignedTo, tags, metadata, lastActivity, createdAt, updatedAt) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.status = status; // active, closed, escalated
    this.priority = priority; // low, medium, high
    this.assignedTo = assignedTo; // ID del admin asignado
    this.tags = tags || [];
    this.metadata = metadata || {};
    this.lastActivity = lastActivity;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Métodos de dominio
  updateLastActivity() {
    this.lastActivity = new Date();
    this.updatedAt = new Date();
  }

  assignTo(adminId) {
    this.assignedTo = adminId;
    this.updatedAt = new Date();
  }

  changeStatus(newStatus) {
    if (['active', 'closed', 'escalated'].includes(newStatus)) {
      this.status = newStatus;
      this.updatedAt = new Date();
    }
  }

  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  updateTitle(newTitle) {
    this.title = newTitle;
    this.updatedAt = new Date();
  }
}
