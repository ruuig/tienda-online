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

  async getRecentMessages(conversationId, { limit = 10 } = {}) {
    if (!conversationId) {
      return [];
    }

    try {
      const rawMessages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        return [];
      }

      return rawMessages
        .map((message) => normalizeDocument(message))
        .reverse();
    } catch (error) {
      console.warn(
        'ConversationPersistenceService: Error obteniendo historial de mensajes:',
        error?.message
      );
      return [];
    }
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

    // Verificar si conversationId es un ObjectId válido o un string personalizado
    let existing = null;
    if (conversationId) {
      // Intentar buscar por ObjectId primero
      try {
        existing = await Conversation.findById(conversationId);
      } catch (error) {
        // Si falla por ObjectId inválido, buscar por sessionId
        console.log('ObjectId inválido, buscando por sessionId:', conversationId);
        if (sessionId) {
          existing = await Conversation.findOne({ sessionId, vendorId });
        } else if (userId) {
          existing = await Conversation.findOne({ userId, vendorId }).sort({ createdAt: -1 }).limit(1);
        }
      }
    } else {
      // Si no hay conversationId, buscar por sessionId o userId
      if (sessionId) {
        existing = await Conversation.findOne({ sessionId, vendorId });
      } else if (userId) {
        existing = await Conversation.findOne({ userId, vendorId }).sort({ createdAt: -1 }).limit(1);
      }
    }

    if (existing) {
      console.log('Conversación existente encontrada:', existing._id);
      if (conversationMetadata && Object.keys(conversationMetadata).length > 0) {
        existing.metadata = {
          ...(existing.metadata || {}),
          ...conversationMetadata
        };
        await existing.save();
      }
      return existing;
    }

    // Crear nueva conversación solo si no existe
    console.log('Creando nueva conversación con sessionId:', sessionId);
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

    try {
      await conversation.save();
      console.log('Nueva conversación creada:', conversation._id);
      return conversation;
    } catch (error) {
      // Si hay error de clave duplicada, buscar la conversación existente
      if (error.code === 11000 && error.keyPattern && error.keyPattern.sessionId) {
        console.log('Clave duplicada detectada, buscando conversación existente...');
        const existingConversation = await Conversation.findOne({ sessionId, vendorId });
        if (existingConversation) {
          console.log('Conversación existente encontrada después de error:', existingConversation._id);
          return existingConversation;
        }
      }
      throw error;
    }
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

    let conversation;

    // Intentar actualizar por ObjectId primero
    try {
      conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        updatePayload,
        { new: true }
      );
    } catch (error) {
      // Si falla por ObjectId inválido, buscar por sessionId
      console.log('ObjectId inválido en update, buscando por sessionId');
      if (updates.sessionId) {
        conversation = await Conversation.findOneAndUpdate(
          { sessionId: updates.sessionId },
          updatePayload,
          { new: true }
        );
      } else {
        // Si conversationId no es ObjectId válido, usarlo como sessionId
        conversation = await Conversation.findOneAndUpdate(
          { sessionId: conversationId },
          updatePayload,
          { new: true }
        );
      }
    }

    return normalizeDocument(conversation);
  }
}
