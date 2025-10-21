// API route para inicializar el servidor WebSocket
import { ChatWebSocketServer } from '@/src/infrastructure/websocket/websocketServer';

let wsServer;

// GET /api/chat-ws - Inicializar servidor WebSocket
export async function GET() {
  try {
    if (!wsServer) {
      // Crear servidor HTTP básico para WebSocket
      const http = await import('http');
      const server = http.createServer();

      wsServer = new ChatWebSocketServer(server);

      // Mantener el servidor vivo (necesario para producción)
      if (process.env.NODE_ENV === 'production') {
        server.listen(0); // Puerto aleatorio para mantener vivo
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Servidor WebSocket inicializado',
      endpoint: '/api/chat-ws'
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error inicializando servidor WebSocket:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error inicializando servidor WebSocket'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
