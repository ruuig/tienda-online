// Casos de uso para el sistema de chat
import { IConversationRepository, IMessageRepository } from '@/src/domain/repositories';

// Caso de uso para crear conversación
export class CreateConversationUseCase {
  constructor(conversationRepository, messageRepository) {
    this.conversationRepository = conversationRepository;
    this.messageRepository = messageRepository;
  }

  async execute(userId, title, initialMessage) {
    try {
      // Crear conversación
      const conversationData = {
        userId,
        title: title || 'Nueva conversación',
        status: 'active',
        createdAt: new Date()
      };

      const conversation = await this.conversationRepository.create(conversationData);

      // Si hay mensaje inicial, crearlo
      if (initialMessage) {
        const messageData = {
          conversationId: conversation._id,
          content: initialMessage,
          sender: 'user',
          type: 'text',
          createdAt: new Date()
        };

        await this.messageRepository.create(messageData);
      }

      return {
        success: true,
        conversation,
        message: initialMessage ? 'Conversación creada con mensaje inicial' : 'Conversación creada'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Caso de uso para enviar mensaje
export class SendMessageUseCase {
  constructor(messageRepository, conversationRepository) {
    this.messageRepository = messageRepository;
    this.conversationRepository = conversationRepository;
  }

  async execute(conversationId, content, sender, type = 'text') {
    try {
      // Crear mensaje
      const messageData = {
        conversationId,
        content,
        sender,
        type,
        createdAt: new Date()
      };

      const message = await this.messageRepository.create(messageData);

      // Actualizar última actividad de la conversación
      await this.conversationRepository.update(conversationId, {
        lastActivity: new Date(),
        updatedAt: new Date()
      });

      return {
        success: true,
        message
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Caso de uso para obtener conversación con mensajes
export class GetConversationUseCase {
  constructor(conversationRepository, messageRepository) {
    this.conversationRepository = conversationRepository;
    this.messageRepository = messageRepository;
  }

  async execute(conversationId, userId) {
    try {
      // Obtener conversación
      const conversation = await this.conversationRepository.findById(conversationId);

      if (!conversation) {
        return {
          success: false,
          message: 'Conversación no encontrada'
        };
      }

      // Verificar permisos
      if (conversation.userId !== userId) {
        return {
          success: false,
          message: 'No tienes permisos para ver esta conversación'
        };
      }

      // Obtener mensajes
      const messages = await this.messageRepository.findByConversationId(conversationId);

      return {
        success: true,
        conversation,
        messages
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
