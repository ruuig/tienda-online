// Servidor WebSocket avanzado con Socket.IO, Redis y ChatService moderno
import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';
import connectDB from '@/src/infrastructure/database/db.js';
import { Conversation } from '@/src/infrastructure/database/models/index.js';
import { createChatService } from '@/src/infrastructure/openai/chatService.js';
import { ConversationPersistenceService } from '@/src/infrastructure/chat/conversationPersistenceService.js';

export class AdvancedChatWebSocketServer {
  constructor(server) {
    this.io = new SocketIOServer(server, {
      path: '/api/chat-ws',
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Inicializar Redis para contexto temporal
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0
    });

    this.chatService = createChatService(process.env.OPENAI_API_KEY);
    this.connectedClients = new Map(); // socketId -> { userId, vendorId, conversationId }
    this.persistenceService = new ConversationPersistenceService();

    this.setupEventHandlers();
    this.startCleanupInterval();

    console.log('🚀 Servidor WebSocket avanzado iniciado con Socket.IO');
  }

  setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      try {
        await this.handleConnection(socket);
      } catch (error) {
        console.error('❌ Error en nueva conexión Socket.IO:', error);
        socket.emit('error', { message: 'Error interno del servidor' });
        socket.disconnect();
      }
    });

    this.io.on('error', (error) => {
      console.error('❌ Error en servidor Socket.IO:', error);
    });
  }

  async handleConnection(socket) {
    console.log(`🔗 Nueva conexión Socket.IO: ${socket.id}`);

    // Configurar heartbeat para detectar desconexiones
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Cuando usuario inicia chat
    socket.on('start_chat', async (data) => {
      try {
        await this.handleStartChat(socket, data);
      } catch (error) {
        console.error('❌ Error iniciando chat:', error);
        socket.emit('error', { message: 'Error iniciando chat' });
      }
    });

    // Cuando usuario envía mensaje
    socket.on('user_message', async (message) => {
      try {
        await this.handleUserMessage(socket, message);
      } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
        socket.emit('error', { message: 'Error procesando mensaje' });
      }
    });

    // Cuando usuario escribe
    socket.on('typing', async (data) => {
      socket.broadcast.emit('user_typing', {
        userId: this.connectedClients.get(socket.id)?.userId,
        isTyping: data.isTyping
      });
    });

    // Cuando usuario deja de escribir
    socket.on('stop_typing', () => {
      socket.broadcast.emit('user_stopped_typing', {
        userId: this.connectedClients.get(socket.id)?.userId
      });
    });

    // Manejar desconexión
    socket.on('disconnect', async (reason) => {
      await this.handleDisconnection(socket, reason);
    });

    // Configurar timeout de inactividad
    socket.conn.on('packet', () => {
      socket.lastActivity = Date.now();
    });

    socket.lastActivity = Date.now();
  }

  async handleStartChat(socket, data) {
    const { userId, vendorId, userAgent, ipAddress } = data;

    if (!vendorId) {
      socket.emit('error', { message: 'VendorId es requerido' });
      return;
    }

    // Inicializar servicio para el vendedor
    await this.chatService.initializeForVendor(vendorId);

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const conversationDoc = await this.persistenceService.ensureConversation({
      conversationId: null,
      vendorId,
      userId: userId || 'anonymous',
      sessionId,
      title: `Chat con ${userId || 'visitante'}`,
      conversationMetadata: {
        userAgent,
        ipAddress,
        socketId: socket.id,
        sessionId
      }
    });
    const conversation = conversationDoc;

    // Guardar información del cliente conectado
    this.connectedClients.set(socket.id, {
      userId: userId || 'anonymous',
      vendorId,
      conversationId: conversation._id.toString(),
      sessionId
    });

    // Guardar contexto en Redis (expira en 2 horas)
    await this.redis.setex(
      `session:${socket.id}`,
      7200, // 2 horas
      JSON.stringify({
        conversationId: conversation._id,
        userId,
        vendorId,
        sessionId,
        startedAt: conversation.startedAt
      })
    );

    // Enviar confirmación de conexión
    socket.emit('chat_started', {
      sessionId,
      conversationId: conversation._id,
      timestamp: new Date().toISOString()
    });

    // Obtener configuración de prompts del vendedor
    const promptConfig = await this.chatService.getPromptConfig(vendorId);

    // Enviar mensaje de bienvenida
    setTimeout(() => {
      socket.emit('message', {
        role: 'assistant',
        content: promptConfig.greetingMessage,
        conversationId: conversation._id,
        timestamp: new Date().toISOString()
      });
    }, 1000);

    console.log(`💬 Chat iniciado - Usuario: ${userId}, Vendor: ${vendorId}, Session: ${sessionId}`);
  }

  async handleUserMessage(socket, messageData) {
    const clientInfo = this.connectedClients.get(socket.id);
    if (!clientInfo) {
      socket.emit('error', { message: 'Sesión no encontrada' });
      return;
    }

    const { conversationId, vendorId, sessionId } = clientInfo;
    const { content } = messageData;

    if (!content || !content.trim()) {
      socket.emit('error', { message: 'Mensaje vacío' });
      return;
    }

    try {
      // Guardar mensaje del usuario en MongoDB
      await this.persistenceService.logMessage({
        conversationId,
        vendorId,
        userId: clientInfo.userId,
        sender: 'user',
        content: content.trim(),
        type: 'text',
        conversationMetadata: {
          socketId: socket.id
        }
      });

      // Actualizar contexto en Redis (últimos 15 mensajes)
      await this.updateRedisContext(conversationId, {
        role: 'user',
        content: content.trim(),
        timestamp: new Date()
      });

      // Procesar mensaje con el sistema avanzado
      const context = {
        vendorId,
        userId: clientInfo.userId,
        userAgent: socket.handshake.headers['user-agent'],
        ipAddress: socket.handshake.address
      };

      const result = await this.chatService.processUserMessage(conversationId, content.trim(), context);

      if (result.success) {
        const { message: savedBotMessage } = await this.persistenceService.logMessage({
          conversationId,
          vendorId,
          userId: clientInfo.userId,
          sender: 'bot',
          content: result.message.content,
          type: result.message.type || 'text',
          messageMetadata: result.message.metadata || {}
        });

        await this.updateRedisContext(conversationId, {
          role: 'assistant',
          content: savedBotMessage.content,
          timestamp: new Date(savedBotMessage.createdAt),
          metadata: savedBotMessage.metadata
        });

        socket.emit('message', {
          role: 'assistant',
          content: savedBotMessage.content,
          conversationId,
          metadata: savedBotMessage.metadata,
          sources: result.sources,
          processingTime: result.processingTime,
          timestamp: savedBotMessage.createdAt
        });

        console.log(`✅ Respuesta enviada - Conversation: ${conversationId}, Processing: ${result.processingTime}ms`);
      } else {
        // Enviar error
        socket.emit('error', {
          message: 'Error procesando mensaje',
          details: result.error
        });
      }

    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
      socket.emit('error', { message: 'Error interno del servidor' });
    }
  }

  async handleDisconnection(socket, reason) {
    const clientInfo = this.connectedClients.get(socket.id);
    if (clientInfo) {
      console.log(`👋 Usuario desconectado - Socket: ${socket.id}, Reason: ${reason}`);

      // Cerrar conversación en MongoDB si está inactiva
      await Conversation.findByIdAndUpdate(clientInfo.conversationId, {
        status: 'closed',
        endedAt: new Date()
      });

      // Limpiar contexto de Redis
      await this.redis.del(`session:${socket.id}`);
      await this.redis.del(`context:${clientInfo.conversationId}`);

      // Remover de clientes conectados
      this.connectedClients.delete(socket.id);
    }
  }

  async updateRedisContext(conversationId, message) {
    try {
      const key = `context:${conversationId}`;

      // Agregar mensaje a la lista (máximo 15 mensajes)
      await this.redis.lpush(key, JSON.stringify(message));
      await this.redis.ltrim(key, 0, 14); // Mantener solo últimos 15

      // Actualizar timestamp de última actividad
      await this.redis.expire(key, 7200); // 2 horas

    } catch (error) {
      console.error('❌ Error actualizando contexto Redis:', error);
    }
  }

  async getConversationContext(conversationId) {
    try {
      const key = `context:${conversationId}`;
      const messages = await this.redis.lrange(key, 0, -1);

      return messages.map(msg => JSON.parse(msg)).reverse(); // Más antiguos primero

    } catch (error) {
      console.error('❌ Error obteniendo contexto Redis:', error);
      return [];
    }
  }

  // Método para obtener estadísticas en tiempo real
  getStats() {
    return {
      connectedClients: this.connectedClients.size,
      activeClients: Array.from(this.connectedClients.entries()).map(([socketId, info]) => ({
        socketId,
        userId: info.userId,
        vendorId: info.vendorId,
        conversationId: info.conversationId,
        sessionId: info.sessionId
      })),
      redisConnected: this.redis.status === 'ready',
      lastActivity: new Date()
    };
  }

  // Método para enviar mensaje a usuario específico
  async sendToUser(socketId, event, data) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }

  // Método para enviar mensaje a todos los usuarios de un vendedor
  async broadcastToVendor(vendorId, event, data) {
    let sentCount = 0;
    for (const [socketId, clientInfo] of this.connectedClients.entries()) {
      if (clientInfo.vendorId === vendorId) {
        const success = await this.sendToUser(socketId, event, data);
        if (success) sentCount++;
      }
    }
    return sentCount;
  }

  // Limpieza periódica de sesiones inactivas
  startCleanupInterval() {
    setInterval(async () => {
      try {
        const now = Date.now();
        const toCleanup = [];

        // Verificar sesiones inactivas por más de 2 horas
        for (const [socketId, clientInfo] of this.connectedClients.entries()) {
          const socket = this.io.sockets.sockets.get(socketId);
          if (!socket || (now - socket.lastActivity) > 2 * 60 * 60 * 1000) {
            toCleanup.push(socketId);
          }
        }

        // Limpiar sesiones inactivas
        for (const socketId of toCleanup) {
          const clientInfo = this.connectedClients.get(socketId);
          if (clientInfo) {
            await Conversation.findByIdAndUpdate(clientInfo.conversationId, {
              status: 'closed',
              endedAt: new Date()
            });

            await this.redis.del(`session:${socketId}`);
            await this.redis.del(`context:${clientInfo.conversationId}`);

            this.connectedClients.delete(socketId);

            // Desconectar socket si existe
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
              socket.disconnect();
            }
          }
        }

        if (toCleanup.length > 0) {
          console.log(`🧹 Sesiones inactivas limpiadas: ${toCleanup.length}`);
        }

      } catch (error) {
        console.error('❌ Error en limpieza periódica:', error);
      }
    }, 10 * 60 * 1000); // Cada 10 minutos
  }

  // Método para cerrar servidor
  async close() {
    console.log('🔄 Cerrando servidor WebSocket...');

    // Cerrar todas las conexiones activas
    for (const [socketId, clientInfo] of this.connectedClients.entries()) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect();
      }

      // Cerrar conversaciones
      await Conversation.findByIdAndUpdate(clientInfo.conversationId, {
        status: 'closed',
        endedAt: new Date()
      });
    }

    // Limpiar Redis
    await this.redis.quit();

    // Cerrar Socket.IO
    this.io.close();

    console.log('✅ Servidor WebSocket cerrado');
  }
}

// Factory function
export const createAdvancedChatWebSocketServer = (server) => {
  return new AdvancedChatWebSocketServer(server);
};
