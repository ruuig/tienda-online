// Entidad de dominio Ticket (no depende de infraestructura)
export class Ticket {
  constructor(id, conversationId, userId, title, description, status, priority, category, assignedTo, tags, resolution, satisfaction, metadata, createdAt, updatedAt) {
    this.id = id;
    this.conversationId = conversationId;
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.status = status; // open, in_progress, waiting_user, resolved, closed, escalated
    this.priority = priority; // low, medium, high, urgent
    this.category = category; // technical, billing, orders, account, products, shipping, returns, other
    this.assignedTo = assignedTo; // ID del admin asignado
    this.tags = tags || [];
    this.resolution = resolution;
    this.satisfaction = satisfaction; // 1-5 rating
    this.metadata = metadata || {};
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Métodos de dominio
  assignTo(adminId) {
    this.assignedTo = adminId;
    this.status = 'in_progress';
    this.metadata.firstResponseTime = new Date();
    this.updatedAt = new Date();
  }

  changeStatus(newStatus) {
    const validStatuses = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'escalated'];
    if (validStatuses.includes(newStatus)) {
      this.status = newStatus;
      if (newStatus === 'resolved') {
        this.metadata.resolutionTime = new Date();
      }
      this.updatedAt = new Date();
    }
  }

  addResolution(resolution) {
    this.resolution = resolution;
    this.status = 'resolved';
    this.metadata.resolutionTime = new Date();
    this.updatedAt = new Date();
  }

  setSatisfaction(rating) {
    if (rating >= 1 && rating <= 5) {
      this.satisfaction = rating;
      this.updatedAt = new Date();
    }
  }

  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  reopen() {
    this.status = 'open';
    this.metadata.reopenedCount = (this.metadata.reopenedCount || 0) + 1;
    this.updatedAt = new Date();
  }

  // Calcular tiempo de resolución en horas
  getResolutionTimeHours() {
    if (!this.metadata.resolutionTime || !this.createdAt) return 0;
    return Math.floor((this.metadata.resolutionTime - this.createdAt) / (1000 * 60 * 60));
  }

  // Verificar si está vencido (más de 24 horas sin respuesta)
  isOverdue() {
    const now = new Date();
    const createdTime = new Date(this.createdAt);
    const diffHours = (now - createdTime) / (1000 * 60 * 60);
    return diffHours > 24 && ['open', 'in_progress'].includes(this.status);
  }
}
