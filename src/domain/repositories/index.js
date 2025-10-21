// Interfaces de repositorios para definir contratos
export class IUserRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async create(userData) {
    throw new Error('Method not implemented');
  }

  async update(id, userData) {
    throw new Error('Method not implemented');
  }
}

export class IOrderRepository {
  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async create(orderData) {
    throw new Error('Method not implemented');
  }
}

export class IProductRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async create(productData) {
    throw new Error('Method not implemented');
  }

  async update(id, productData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }
}

export class IHeaderSliderRepository {
  async findOne(query) {
    throw new Error('Method not implemented');
  }

  async findOneAndUpdate(query, update, options) {
    throw new Error('Method not implemented');
  }
}

// Nuevas interfaces para el sistema de chat
export class IConversationRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  async findAll(filters) {
    throw new Error('Method not implemented');
  }

  async create(conversationData) {
    throw new Error('Method not implemented');
  }

  async update(id, conversationData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findActiveByUser(userId) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status) {
    throw new Error('Method not implemented');
  }
}

export class IMessageRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByConversationId(conversationId) {
    throw new Error('Method not implemented');
  }

  async create(messageData) {
    throw new Error('Method not implemented');
  }

  async markAsRead(messageId, userId) {
    throw new Error('Method not implemented');
  }

  async findUnreadByConversation(conversationId, userId) {
    throw new Error('Method not implemented');
  }
}

export class IDocumentRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findAll(filters) {
    throw new Error('Method not implemented');
  }

  async findByType(type) {
    throw new Error('Method not implemented');
  }

  async findByCategory(category) {
    throw new Error('Method not implemented');
  }

  async create(documentData) {
    throw new Error('Method not implemented');
  }

  async update(id, documentData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async searchByContent(query) {
    throw new Error('Method not implemented');
  }
}

export class IChatSessionRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findBySocketId(socketId) {
    throw new Error('Method not implemented');
  }

  async findActiveByUser(userId) {
    throw new Error('Method not implemented');
  }

  async create(sessionData) {
    throw new Error('Method not implemented');
  }

  async updateLastActivity(id) {
    throw new Error('Method not implemented');
  }

  async deactivateBySocketId(socketId) {
    throw new Error('Method not implemented');
  }

  async cleanupInactiveSessions() {
    throw new Error('Method not implemented');
  }
}

export class ITicketRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  async findByConversationId(conversationId) {
    throw new Error('Method not implemented');
  }

  async findAll(filters) {
    throw new Error('Method not implemented');
  }

  async create(ticketData) {
    throw new Error('Method not implemented');
  }

  async update(id, ticketData) {
    throw new Error('Method not implemented');
  }

  async assignTo(id, adminId) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status) {
    throw new Error('Method not implemented');
  }

  async findByPriority(priority) {
    throw new Error('Method not implemented');
  }

  async findOverdue() {
    throw new Error('Method not implemented');
  }
}
