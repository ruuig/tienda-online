// Servidor WebSocket para comunicación en tiempo real del chat
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { ConversationRepositoryImpl, MessageRepositoryImpl, ChatSessionRepositoryImpl } from '@/src/infrastructure/database/repositories';
import connectDB from '@/config/db';

export class ChatWebSocketServer {
  constructor(server) {
    this.wss = new WebSocketServer({
      server,
      path: '/api/chat-ws',
      perMessageDeflate: false,
      clientTracking: true
    });

    this.conversationRepository = new ConversationRepositoryImpl();
    this.messageRepository = new MessageRepositoryImpl();
    this.chatSessionRepository = new ChatSessionRepositoryImpl();

    this.setupEventHandlers();
    this.startCleanupInterval();

    console.log('Servidor WebSocket iniciado en /api/chat-ws');
  }

  setupEventHandlers() {
    this.wss.on('connection', async (ws, request) => {
      try {
        await this.handleConnection(ws, request);
      } catch (error) {
        console.error('Error en nueva conexión WebSocket:', error);
        ws.close(1011, 'Error interno del servidor');
      }
    });

    this.wss.on('error', (error) => {
      console.error('Error en servidor WebSocket:', error);
    });

    this.wss.on('close', () => {
      console.log('Servidor WebSocket cerrado');
    });
  }

  async handleConnection(ws, request) {
    // Extraer información de autenticación del header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ws.close(1008, 'Token de autenticación requerido');
      return;
    }

    const token = authHeader.substring(7);

    // Aquí deberías verificar el token con Clerk
    // Por simplicidad, asumimos que el token es válido por ahora
    const userId = this.extractUserIdFromToken(token);
    if (!userId) {
      ws.close(1008, 'Token inválido');
      return;
    }

    // Crear sesión de chat
    const sessionData = {
      userId,
      socketId: this.generateSocketId(),
      isActive: true,
      connectedAt: new Date(),
      lastActivity: new Date(),
      metadata: {
        userAgent: request.headers['user-agent'],
        ipAddress: request.socket.remoteAddress,
      }
    };

    let chatSession;
    try {
      await connectDB();
      chatSession = await this.chatSessionRepository.create(sessionData);
    } catch (error) {
      console.error('Error creando sesión de chat:', error);
      ws.close(1011, 'Error creando sesión');
      return;
    }

    // Configurar handlers para esta conexión
    ws.userId = userId;
    ws.sessionId = chatSession._id;
    ws.isAlive = true;

    // Configurar heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data) => {
      try {
        await this.handleMessage(ws, data);
      } catch (error) {
        console.error('Error procesando mensaje:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error procesando mensaje'
        }));
      }
    });

    ws.on('close', async (code, reason) => {
      await this.handleDisconnection(ws, code, reason);
    });

    ws.on('error', (error) => {
      console.error('Error en conexión WebSocket:', error);
    });

    // Enviar mensaje de bienvenida
    ws.send(JSON.stringify({
      type: 'connected',
      sessionId: chatSession._id,
      timestamp: new Date().toISOString()
    }));

    console.log(`👤 Usuario ${userId} conectado (sesión: ${chatSession._id})`);
  }

  async handleMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString());

      // Actualizar actividad de sesión
      await this.chatSessionRepository.updateLastActivity(ws.sessionId);

      switch (message.type) {
        case 'join_conversation':
          await this.handleJoinConversation(ws, message.conversationId);
          break;

        case 'leave_conversation':
          await this.handleLeaveConversation(ws, message.conversationId);
          break;

        case 'chat_message':
          await this.handleChatMessage(ws, message);
          break;

        case 'typing':
          await this.handleTypingIndicator(ws, message);
          break;

        case 'mark_read':
          await this.handleMarkAsRead(ws, message);
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Tipo de mensaje no reconocido'
          }));
      }
    } catch (error) {
      console.error('Error parseando mensaje WebSocket:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Mensaje inválido'
      }));
    }
  }

  async handleJoinConversation(ws, conversationId) {
    try {
      // Verificar que la conversación existe y pertenece al usuario
      const conversation = await this.conversationRepository.findById(conversationId);
      if (!conversation || conversation.userId !== ws.userId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Conversación no encontrada o acceso denegado'
        }));
        return;
      }

      // Actualizar estado de conversación
      await this.conversationRepository.update(conversationId, {
        status: 'active',
        lastActivity: new Date()
      });

      // Obtener mensajes recientes
      const messages = await this.messageRepository.findByConversationId(conversationId);

      // Enviar historial al cliente
      ws.send(JSON.stringify({
        type: 'conversation_joined',
        conversationId,
        messages: messages.slice(-50), // Últimos 50 mensajes
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error uniendo a conversación:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error al unir a conversación'
      }));
    }
  }

  async handleChatMessage(ws, message) {
    try {
      const { conversationId, content, type = 'text' } = message;

      if (!conversationId || !content) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Datos de mensaje incompletos'
        }));
        return;
      }

      // Crear mensaje en BD
      const messageData = {
        conversationId,
        content,
        sender: 'user',
        type,
        createdAt: new Date()
      };

      const savedMessage = await this.messageRepository.create(messageData);

      // Actualizar conversación
      await this.conversationRepository.update(conversationId, {
        lastActivity: new Date(),
        updatedAt: new Date()
      });

      // Enviar mensaje a todos los clientes conectados en esta conversación
      this.broadcastToConversation(conversationId, {
        type: 'new_message',
        message: savedMessage,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error procesando mensaje de chat:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error procesando mensaje'
      }));
    }
  }

  async handleTypingIndicator(ws, message) {
    const { conversationId, isTyping } = message;

    // Enviar indicador de escritura a otros usuarios en la conversación
    this.broadcastToConversation(conversationId, {
      type: 'typing',
      userId: ws.userId,
      isTyping,
      timestamp: new Date().toISOString()
    }, ws); // Excluir al emisor
  }

  async handleMarkAsRead(ws, message) {
    const { messageId } = message;

    try {
      await this.messageRepository.markAsRead(messageId, ws.userId);

      // Notificar a otros usuarios que el mensaje fue leído
      ws.send(JSON.stringify({
        type: 'message_read',
        messageId,
        userId: ws.userId,
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error marcando mensaje como leído:', error);
    }
  }

  async handleDisconnection(ws, code, reason) {
    try {
      // Marcar sesión como inactiva
      await this.chatSessionRepository.deactivateBySocketId(ws.sessionId);

      console.log(`👤 Usuario ${ws.userId} desconectado (sesión: ${ws.sessionId})`);

    } catch (error) {
      console.error('Error manejando desconexión:', error);
    }
  }

  // Método auxiliar para enviar mensaje a todos los clientes en una conversación
  broadcastToConversation(conversationId, data, excludeWs = null) {
    this.wss.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === 1) { // WebSocket.OPEN
        // Aquí podrías verificar si el cliente está en la conversación específica
        client.send(JSON.stringify(data));
      }
    });
  }

  // Generar ID único para socket
  generateSocketId() {
    return `socket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Extraer userId del token (simplificado)
  extractUserIdFromToken(token) {
    try {
      // Aquí deberías verificar el token real con Clerk
      // Por ahora, retornamos un ID de ejemplo
      return `user_${token.substring(0, 8)}`;
    } catch (error) {
      return null;
    }
  }

  // Iniciar limpieza periódica de sesiones inactivas
  startCleanupInterval() {
    setInterval(async () => {
      try {
        await this.chatSessionRepository.cleanupInactiveSessions();
      } catch (error) {
        console.error('Error limpiando sesiones inactivas:', error);
      }
    }, 60 * 60 * 1000); // Cada hora
  }
}
