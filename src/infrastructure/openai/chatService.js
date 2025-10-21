// Servicio de chat inteligente que integra OpenAI con el sistema de conversaciones
import { OpenAIClient } from './openaiClient.js';

export class ChatService {
  constructor(openaiApiKey) {
    this.openaiClient = new OpenAIClient(openaiApiKey);
  }

  /**
   * Procesa un mensaje del usuario y genera respuesta automática
   * @param {string} conversationId - ID de la conversación
   * @param {string} userMessage - Mensaje del usuario
   * @param {Object} context - Contexto adicional
   * @returns {Promise<Object>} - Respuesta procesada
   */
  async processUserMessage(conversationId, userMessage, context = {}) {
    const startTime = Date.now();
    console.log('ChatService: Procesando mensaje:', { conversationId, userMessage: userMessage.substring(0, 100) });

    try {
      console.log('ChatService: Clasificando intención...');
      // 1. Clasificar intención del mensaje
      const intent = await this.openaiClient.classifyIntent(userMessage);
      console.log('ChatService: Intención clasificada:', intent);

      // 2. Generar respuesta con OpenAI usando mensajes recientes simulados
      const messages = [
        { role: 'system', content: this.getSystemMessage() },
        { role: 'user', content: userMessage }
      ];

      console.log('ChatService: Generando respuesta con OpenAI...');
      const response = await this.openaiClient.generateResponse(messages, {
        intent: intent.intent,
        confidence: intent.confidence
      });

      console.log('ChatService: Respuesta generada:', response.substring(0, 100));

      // 3. Crear mensaje de respuesta del bot
      const botMessageData = {
        conversationId,
        content: response,
        sender: 'bot',
        type: 'text',
        metadata: {
          intent: intent.intent,
          confidence: intent.confidence,
          processingTime: Date.now() - startTime,
          model: 'gpt-4'
        },
        createdAt: new Date()
      };

      console.log('ChatService: Mensaje creado exitosamente');
      return {
        success: true,
        message: botMessageData,
        intent,
        sources: [],
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('ChatService: Error procesando mensaje:', error);
      console.error('ChatService: Error stack:', error.stack);

      // Crear mensaje de error del bot
      const errorMessageData = {
        conversationId,
        content: 'Lo siento, estoy teniendo problemas para procesar tu consulta. Un agente especializado te ayudará en unos momentos.',
        sender: 'bot',
        type: 'text',
        metadata: {
          error: true,
          originalError: error.message,
          processingTime: Date.now() - startTime
        },
        createdAt: new Date()
      };

      return {
        success: false,
        message: errorMessageData,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Genera el mensaje del sistema para OpenAI
   * @returns {string} - Mensaje del sistema
   */
  getSystemMessage() {
    return `Eres un asistente de atención al cliente para una tienda online de tecnología.

INSTRUCCIONES:
- Sé amable, profesional y útil
- Responde en español de manera clara y concisa
- Si no sabes algo, di "Déjame consultar con un agente especializado"
- Para consultas técnicas, proporciona información precisa basada en documentos disponibles
- Nunca inventes información sobre productos o políticas

CONTEXTO DE LA TIENDA:
- Somos especialistas en tecnología y productos electrónicos
- Ofrecemos garantía en todos nuestros productos
- Envío gratuito en compras mayores a Q500
- Políticas de devolución: 30 días para productos sin usar

Responde siempre de manera útil y orientada al cliente.`;
  }

  /**
   * Obtiene estadísticas del servicio de chat
   * @returns {Promise<Object>} - Estadísticas de uso
   */
  async getStats() {
    return {
      totalConversations: 0,
      activeConversations: 0,
      totalMessages: 0,
      averageMessagesPerConversation: 0
    };
  }
}

// Factory function para crear servicio de chat
export const createChatService = (openaiApiKey) => {
  return new ChatService(openaiApiKey);
};
