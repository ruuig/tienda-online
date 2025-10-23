import { Conversation, Message } from '@/src/infrastructure/database/models/index.js';

const MESSAGE_PREVIEW_LENGTH = 200;
const PERSISTENCE_THRESHOLD = 4;

function normalizeDocument(document) {
  if (!document) {
    return null;
  }

  const plain = document.toObject ? document.toObject() : { ...document };

  if (plain._id) {
    plain._id = plain._id.toString();
  }

  if (plain.conversationId) {
    plain.conversationId = plain.conversationId.toString();
  }

  Object.keys(plain).forEach((key) => {
    const value = plain[key];
    if (value instanceof Date) {
      plain[key] = value.toISOString();
    }
  });

  return plain;
}

export class ConversationPersistenceService {
  constructor({ persistThreshold = PERSISTENCE_THRESHOLD } = {}) {
    this.persistThreshold = persistThreshold;
  }

  async ensureConversation({
    conversationId,
    vendorId,
    userId,
    sessionId,
    title,
    conversationMetadata = {}
  }) {
    if (!vendorId) {
      throw new Error('vendorId is requerido para registrar una conversación');
    }

    if (conversationId) {
      const existing = await Conversation.findById(conversationId);
      if (existing) {
        if (conversationMetadata && Object.keys(conversationMetadata).length > 0) {
          existing.metadata = {
            ...(existing.metadata || {}),
            ...conversationMetadata
          };
          await existing.save();
        }
        return existing;
      }
    }

    const now = new Date();
    const conversation = new Conversation({
      userId: userId || 'anonymous',
      vendorId,
      sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      title: title || 'Chat con asistente',
      status: 'active',
      priority: 'medium',
      metadata: conversationMetadata,
      messageCount: 0,
      isPersisted: false,
      startedAt: now,
      lastActivity: now,
      createdAt: now,
      updatedAt: now
    });

    await conversation.save();
    return conversation;
  }

  async logMessage({
    conversationId,
    vendorId,
    userId,
    sender = 'user',
    content,
    type = 'text',
    messageMetadata = {},
    conversationMetadata = {},
    sessionId,
    title
  }) {
    if (!content || !content.trim()) {
      throw new Error('El contenido del mensaje no puede estar vacío');
    }

    const conversation = await this.ensureConversation({
      conversationId,
      vendorId,
      userId,
      sessionId,
      title,
      conversationMetadata
    });

    const now = new Date();
    const messageDoc = await Message.create({
      conversationId: conversation._id,
      content: content.trim(),
      sender,
      type,
      metadata: messageMetadata,
      createdAt: now
    });

    const update = {
      $inc: { messageCount: 1 },
      $set: {
        lastActivity: now,
        lastMessageSender: sender,
        lastMessagePreview: content.trim().slice(0, MESSAGE_PREVIEW_LENGTH),
        updatedAt: now
      }
    };

    if (!conversation.startedAt) {
      update.$set.startedAt = now;
    }

    if (conversationMetadata && Object.keys(conversationMetadata).length > 0) {
      update.$set.metadata = {
        ...(conversation.metadata || {}),
        ...conversationMetadata
      };
    }

    let updatedConversation = await Conversation.findByIdAndUpdate(
      conversation._id,
      update,
      { new: true }
    );

    if (
      updatedConversation &&
      !updatedConversation.isPersisted &&
      updatedConversation.messageCount >= this.persistThreshold
    ) {
      updatedConversation = await Conversation.findByIdAndUpdate(
        conversation._id,
        {
          $set: {
            isPersisted: true,
            updatedAt: now
          }
        },
        { new: true }
      );
    }

    return {
      conversation: normalizeDocument(updatedConversation),
      message: normalizeDocument(messageDoc)
    };
  }

  async updateConversation(conversationId, updates) {
    const now = new Date();
    const updatePayload = {
      ...updates,
      updatedAt: now
    };

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      updatePayload,
      { new: true }
    );

    return normalizeDocument(conversation);
  }
}
