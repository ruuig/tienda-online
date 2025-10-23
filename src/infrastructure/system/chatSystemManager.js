// Script de inicialización del sistema de chat avanzado
import connectDB from '@/src/infrastructure/database/db.js';
import { createChatService } from '@/src/infrastructure/openai/chatService.js';
import { getSharedRAGService } from '@/src/infrastructure/rag/ragServiceRegistry.js';
import { createAdvancedChatWebSocketServer } from '@/src/infrastructure/websocket/advancedWebSocketServer.js';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import Redis from 'ioredis';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

export class ChatSystemManager {
  constructor() {
    this.initialized = false;
    this.chatService = null;
    this.ragService = null;
    this.websocketServer = null;
    this.redis = null;
    this.nextApp = null;
    this.server = null;
  }

  async initialize() {
    try {
      console.log('🚀 Iniciando sistema de chat avanzado...');

      // 1. Conectar a MongoDB
      await connectDB();
      console.log('✅ MongoDB conectado');

      // 2. Inicializar Redis
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0
      });

      this.redis.on('connect', () => console.log('✅ Redis conectado'));
      this.redis.on('error', (err) => console.error('❌ Error Redis:', err));

      await new Promise((resolve, reject) => {
        this.redis.on('ready', resolve);
        this.redis.on('error', reject);
        setTimeout(reject, 5000); // Timeout de 5 segundos
      });

      // 3. Inicializar servicios
      this.chatService = createChatService(process.env.OPENAI_API_KEY);
      this.ragService = getSharedRAGService();

      console.log('✅ Servicios inicializados');

      // 4. Configurar Next.js
      this.nextApp = next({ dev, hostname, port });
      await this.nextApp.prepare();
      console.log('✅ Next.js preparado');

      // 5. Crear servidor HTTP
      this.server = createServer(async (req, res) => {
        try {
          const parsedUrl = parse(req.url, true);
          await this.nextApp.getRequestHandler()(req, res, parsedUrl);
        } catch (err) {
          console.error('Error handling request:', err);
          res.statusCode = 500;
          res.end('Internal server error');
        }
      });

      // 6. Inicializar WebSocket avanzado
      this.websocketServer = createAdvancedChatWebSocketServer(this.server);
      console.log('✅ WebSocket avanzado inicializado');

      // 7. Configurar rutas API personalizadas
      this.setupCustomRoutes();

      // 8. Iniciar servidor
      this.server.listen(port, (err) => {
        if (err) throw err;
        console.log(`🚀 Servidor listo en http://${hostname}:${port}`);
        console.log(`💬 WebSocket disponible en ws://${hostname}:${port}/api/chat-ws`);
      });

      this.initialized = true;
      console.log('🎉 Sistema de chat avanzado inicializado completamente');

      return {
        success: true,
        port,
        websocketPath: '/api/chat-ws',
        services: {
          chatService: true,
          ragService: true,
          websocket: true,
          redis: true,
          mongodb: true
        }
      };

    } catch (error) {
      console.error('❌ Error inicializando sistema:', error);
      throw error;
    }
  }

  setupCustomRoutes() {
    // Configurar rutas API adicionales si es necesario
    console.log('🔧 Rutas API personalizadas configuradas');
  }

  async initializeVendors() {
    try {
      console.log('🏪 Inicializando servicios para vendedores...');

      // Obtener todos los vendors únicos de la base de datos
      const { models } = await import('@/src/infrastructure/database/models/index.js');
      const vendors = await models.Conversation.distinct('vendorId');

      if (vendors.length === 0) {
        console.log('⚠️ No hay vendors configurados aún');
        return;
      }

      const results = [];

      for (const vendorId of vendors) {
        try {
          const result = await this.chatService.initializeForVendor(vendorId);
          results.push({
            vendorId,
            success: result.success,
            ragInitialized: result.ragInitialized,
            productsLoaded: result.productsLoaded
          });
        } catch (error) {
          results.push({
            vendorId,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ ${successCount}/${vendors.length} vendors inicializados`);

      return results;

    } catch (error) {
      console.error('❌ Error inicializando vendors:', error);
      throw error;
    }
  }

  getSystemStats() {
    return {
      initialized: this.initialized,
      websocket: this.websocketServer?.getStats(),
      timestamp: new Date().toISOString()
    };
  }

  async cleanup() {
    console.log('🧹 Limpiando sistema...');

    try {
      if (this.websocketServer) {
        await this.websocketServer.close();
      }

      if (this.redis) {
        await this.redis.quit();
      }

      if (this.ragService) {
        await this.ragService.cleanup();
      }

      if (this.server) {
        this.server.close();
      }

      console.log('✅ Sistema limpiado completamente');
    } catch (error) {
      console.error('❌ Error limpiando sistema:', error);
    }
  }
}

// Función principal para inicializar el sistema
export async function initializeChatSystem() {
  const manager = new ChatSystemManager();

  try {
    const result = await manager.initialize();

    // Inicializar vendors después de un breve delay
    setTimeout(async () => {
      try {
        await manager.initializeVendors();
      } catch (error) {
        console.error('❌ Error inicializando vendors:', error);
      }
    }, 5000);

    return manager;
  } catch (error) {
    console.error('❌ Error fatal inicializando sistema:', error);
    process.exit(1);
  }
}

// Manejo de señales de cierre
process.on('SIGTERM', async () => {
  console.log('📴 Señal SIGTERM recibida, cerrando sistema...');
  const manager = global.chatSystemManager;
  if (manager) {
    await manager.cleanup();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 Señal SIGINT recibida, cerrando sistema...');
  const manager = global.chatSystemManager;
  if (manager) {
    await manager.cleanup();
  }
  process.exit(0);
});

// Exportar para uso en otros módulos
export default ChatSystemManager;
