// Implementaciones de repositorios que usan los modelos reales
import { Product, User, Order, Address, HeaderSlider } from '@/src/domain/entities';
import { IProductRepository, IUserRepository, IOrderRepository, IHeaderSliderRepository, IConversationRepository, IMessageRepository, IDocumentRepository, IChatSessionRepository, ITicketRepository } from '@/src/domain/repositories';

// Modelos reales de infraestructura (los mismos que las entidades)
import { Conversation, Message, Document, ChatSession, Ticket } from '@/src/infrastructure/database/models/index.js';

export class ProductRepositoryImpl extends IProductRepository {
  async findById(id) {
    return await Product.findById(id);
  }

  async findAll() {
    return await Product.find({}).sort({ date: -1 });
  }

  async create(productData) {
    const newProduct = new Product(productData);
    return await newProduct.save();
  }

  async update(id, productData) {
    return await Product.findByIdAndUpdate(id, productData, { new: true });
  }

  async delete(id) {
    return await Product.findByIdAndDelete(id);
  }
}

export class UserRepositoryImpl extends IUserRepository {
  async findById(id) {
    return await User.findById(id);
  }

  async create(userData) {
    const newUser = new User(userData);
    return await newUser.save();
  }

  async update(id, userData) {
    return await User.findByIdAndUpdate(id, userData, { new: true });
  }
}

export class OrderRepositoryImpl extends IOrderRepository {
  async findByUserId(userId) {
    return await Order.find({ userId }).populate('address items.product');
  }

  async findAll() {
    return await Order.find({}).populate('address items.product');
  }

  async create(orderData) {
    const newOrder = new Order(orderData);
    return await newOrder.save();
  }
}

export class HeaderSliderRepositoryImpl extends IHeaderSliderRepository {
  async findOne(query) {
    return await HeaderSlider.findOne(query);
  }

  async findOneAndUpdate(query, update, options) {
    return await HeaderSlider.findOneAndUpdate(query, update, options);
  }
}

// Implementaciones de repositorios para el sistema de chat
export class ConversationRepositoryImpl extends IConversationRepository {
  async findById(id) {
    return await Conversation.findById(id);
  }

  async findByUserId(userId) {
    return await Conversation.find({ userId }).sort({ updatedAt: -1 });
  }

  async findAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.userId) query.userId = filters.userId;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;
    if (filters.vendorId) query.vendorId = filters.vendorId;

    if (filters.persistedOnly !== undefined) {
      query.isPersisted = filters.persistedOnly;
    }

    if (filters.minMessageCount !== undefined) {
      query.messageCount = { $gte: filters.minMessageCount };
    }

    return await Conversation.find(query).sort({ updatedAt: -1 });
  }

  async create(conversationData) {
    const conversation = new Conversation(conversationData);
    return await conversation.save();
  }

  async update(id, conversationData) {
    return await Conversation.findByIdAndUpdate(id, conversationData, { new: true });
  }

  async delete(id) {
    return await Conversation.findByIdAndDelete(id);
  }

  async findActiveByUser(userId) {
    return await Conversation.find({ userId, status: 'active' }).sort({ updatedAt: -1 });
  }

  async findByStatus(status) {
    return await Conversation.find({ status }).sort({ updatedAt: -1 });
  }
}

export class MessageRepositoryImpl extends IMessageRepository {
  async findById(id) {
    return await Message.findById(id);
  }

  async findByConversationId(conversationId) {
    return await Message.find({ conversationId }).sort({ createdAt: 1 });
  }

  async create(messageData) {
    const message = new Message(messageData);
    return await message.save();
  }

  async markAsRead(messageId, userId) {
    return await Message.findByIdAndUpdate(messageId, {
      $push: { readBy: { userId, readAt: new Date() } }
    }, { new: true });
  }

  async findUnreadByConversation(conversationId, userId) {
    return await Message.find({
      conversationId,
      'readBy.userId': { $ne: userId }
    }).sort({ createdAt: 1 });
  }
}

export class DocumentRepositoryImpl extends IDocumentRepository {
  async findById(id) {
    return await Document.findById(id);
  }

  async findAll(filters = {}) {
    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.category) query.category = filters.category;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    return await Document.find(query).sort({ createdAt: -1 });
  }

  async findByType(type) {
    return await Document.find({ type, isActive: true }).sort({ createdAt: -1 });
  }

  async findByCategory(category) {
    return await Document.find({ category, isActive: true }).sort({ createdAt: -1 });
  }

  async create(documentData) {
    const document = new Document(documentData);
    return await document.save();
  }

  async update(id, documentData) {
    return await Document.findByIdAndUpdate(id, documentData, { new: true });
  }

  async delete(id) {
    return await Document.findByIdAndDelete(id);
  }

  async searchByContent(query) {
    return await Document.find(
      { $text: { $search: query }, isActive: true },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });
  }
}

export class ChatSessionRepositoryImpl extends IChatSessionRepository {
  async findById(id) {
    return await ChatSession.findById(id);
  }

  async findBySocketId(socketId) {
    return await ChatSession.findOne({ socketId, isActive: true });
  }

  async findActiveByUser(userId) {
    return await ChatSession.find({ userId, isActive: true }).sort({ lastActivity: -1 });
  }

  async create(sessionData) {
    const session = new ChatSession(sessionData);
    return await session.save();
  }

  async updateLastActivity(id) {
    return await ChatSession.findByIdAndUpdate(id, { lastActivity: new Date() });
  }

  async deactivateBySocketId(socketId) {
    return await ChatSession.findOneAndUpdate(
      { socketId },
      { isActive: false },
      { new: true }
    );
  }

  async cleanupInactiveSessions() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await ChatSession.deleteMany({
      lastActivity: { $lt: oneDayAgo }
    });
  }
}

export class TicketRepositoryImpl extends ITicketRepository {
  async findById(id) {
    return await Ticket.findById(id).populate('conversationId');
  }

  async findByUserId(userId) {
    return await Ticket.find({ userId }).sort({ createdAt: -1 });
  }

  async findByConversationId(conversationId) {
    return await Ticket.findOne({ conversationId });
  }

  async findAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.category) query.category = filters.category;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;
    if (filters.userId) query.userId = filters.userId;
    if (filters.source) query['metadata.source'] = filters.source;

    return await Ticket.find(query).sort({ createdAt: -1 });
  }

  async create(ticketData) {
    const ticket = new Ticket({
      ...ticketData,
      messages: ticketData.messages || []
    });
    return await ticket.save();
  }

  async update(id, ticketData) {
    const { messages: messagesToAppend, ...fieldsToUpdate } = ticketData || {};
    const updateOperations = {};

    if (fieldsToUpdate && Object.keys(fieldsToUpdate).length > 0) {
      updateOperations.$set = {
        ...fieldsToUpdate,
        updatedAt: new Date()
      };
    } else {
      updateOperations.$set = { updatedAt: new Date() };
    }

    if (messagesToAppend) {
      const messagesArray = Array.isArray(messagesToAppend) ? messagesToAppend : [messagesToAppend];
      const normalizedMessages = messagesArray
        .filter(message => !!message)
        .map(message => ({
          ...message,
          createdAt: message?.createdAt ? new Date(message.createdAt) : new Date()
        }));

      if (normalizedMessages.length > 0) {
        updateOperations.$push = {
          messages: {
            $each: normalizedMessages
          }
        };
      }
    }

    return await Ticket.findByIdAndUpdate(id, updateOperations, { new: true });
  }

  async assignTo(id, adminId) {
    return await Ticket.findByIdAndUpdate(id, {
      assignedTo: adminId,
      status: 'in_progress',
      'metadata.firstResponseTime': new Date()
    }, { new: true });
  }

  async findByStatus(status) {
    return await Ticket.find({ status }).sort({ createdAt: -1 });
  }

  async findByPriority(priority) {
    return await Ticket.find({ priority }).sort({ createdAt: -1 });
  }

  async findOverdue() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await Ticket.find({
      status: { $in: ['open', 'in_progress'] },
      createdAt: { $lt: oneDayAgo }
    }).sort({ createdAt: 1 });
  }
}
