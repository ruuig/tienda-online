// Entidad de dominio Ticket (no depende de infraestructura)
export class Ticket {
  constructor(
    idOrData,
    conversationId,
    userId,
    title,
    description,
    status,
    priority,
    category,
    assignedTo,
    tags,
    resolution,
    satisfaction,
    metadata,
    createdAt,
    updatedAt,
    messages
  ) {
    if (idOrData && typeof idOrData === 'object' && !Array.isArray(idOrData)) {
      this.#initializeFromObject(idOrData);
      return;
    }

    this.#initializeFromParams({
      id: idOrData,
      conversationId,
      userId,
      title,
      description,
      status,
      priority,
      category,
      assignedTo,
      tags,
      resolution,
      satisfaction,
      metadata,
      createdAt,
      updatedAt,
      messages
    });
  }

  #initializeFromObject({
    id,
    _id,
    conversationId = null,
    userId = null,
    title,
    description,
    status = 'open',
    priority = 'medium',
    category,
    assignedTo = null,
    tags = [],
    resolution,
    satisfaction,
    metadata = {},
    createdAt,
    updatedAt,
    messages = []
  }) {
    this.#initializeFromParams({
      id: id ?? _id ?? null,
      conversationId,
      userId,
      title,
      description,
      status,
      priority,
      category,
      assignedTo,
      tags,
      resolution,
      satisfaction,
      metadata,
      createdAt,
      updatedAt,
      messages
    });
  }

  #initializeFromParams({
    id,
    conversationId = null,
    userId = null,
    title,
    description,
    status = 'open',
    priority = 'medium',
    category,
    assignedTo = null,
    tags = [],
    resolution,
    satisfaction,
    metadata = {},
    createdAt,
    updatedAt,
    messages = []
  }) {
    this.id = id ?? null;
    this.conversationId = conversationId ?? null;
    this.userId = userId ?? null;
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
    this.messages = Array.isArray(messages) ? messages : [];
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  ensureMetadata() {
    if (!this.metadata) {
      this.metadata = {};
    }
  }

  ensureMessages() {
    if (!Array.isArray(this.messages)) {
      this.messages = [];
    }
  }

  // Métodos de dominio
  assignTo(adminId) {
    this.assignedTo = adminId;
    this.status = 'in_progress';
    this.ensureMetadata();
    this.metadata.firstResponseTime = new Date();
    this.updatedAt = new Date();
  }

  changeStatus(newStatus) {
    const validStatuses = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'escalated'];
    if (validStatuses.includes(newStatus)) {
      this.status = newStatus;
      if (newStatus === 'resolved') {
        this.ensureMetadata();
        this.metadata.resolutionTime = new Date();
      }
      this.updatedAt = new Date();
    }
  }

  addResolution(resolution) {
    this.resolution = resolution;
    this.status = 'resolved';
    this.ensureMetadata();
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

  addMessage(message) {
    if (!message || typeof message !== 'object') return;

    this.ensureMessages();
    const { createdAt, ...rest } = message;
    this.messages.push({
      ...rest,
      createdAt: createdAt ? new Date(createdAt) : new Date()
    });
    this.updatedAt = new Date();
  }

  matchesSource(source) {
    if (!source) return true;
    return (this.metadata && this.metadata.source) === source;
  }

  reopen() {
    this.status = 'open';
    this.ensureMetadata();
    this.metadata.reopenedCount = (this.metadata.reopenedCount || 0) + 1;
    this.updatedAt = new Date();
  }

  // Calcular tiempo de resolución en horas
  getResolutionTimeHours() {
    if (!this.metadata || !this.metadata.resolutionTime || !this.createdAt) return 0;
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
