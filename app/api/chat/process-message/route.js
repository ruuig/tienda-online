// API para procesar mensajes con OpenAI
import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ChatService } from '@/src/infrastructure/openai/chatService';

// POST /api/chat/process-message - Procesar mensaje con IA
export async function POST(request) {
  try {
    console.log('=== NUEVA SOLICITUD DE CHAT ===');

    await connectDB();
    console.log('Base de datos conectada');

    // Obtener usuario autenticado directamente desde Clerk (opcional para pruebas)
    const { userId, user } = getAuth(request);
    console.log('Usuario autenticado:', { userId, user: !!user });

    const body = await request.json();
    console.log('Datos recibidos:', body);

    const { conversationId, message, userInfo } = body;

    if (!conversationId || !message) {
      console.log('ERROR: Datos faltantes', { conversationId, message: !!message });
      return NextResponse.json({
        success: false,
        message: 'Faltan datos requeridos'
      }, { status: 400 });
    }

    // Obtener clave de OpenAI desde variables de entorno
    const openaiApiKey = process.env.OPENAI_API_KEY;
    console.log('API Key de OpenAI:', !!openaiApiKey ? 'Configurada' : 'NO CONFIGURADA');

    if (!openaiApiKey) {
      console.log('ERROR: API Key de OpenAI no configurada');
      return NextResponse.json({
        success: false,
        message: 'Servicio de IA no disponible'
      }, { status: 503 });
    }

    console.log('Procesando mensaje con ChatService...');
    // Crear servicio de chat
    const chatService = new ChatService(openaiApiKey);

    // Procesar mensaje con IA (usar usuario autenticado si existe, sino usuario por defecto)
    const userContext = user ? {
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.primaryEmailAddress?.emailAddress,
      ...userInfo
    } : {
      id: 'demo-user',
      name: 'Usuario Demo',
      email: 'demo@example.com',
      ...userInfo
    };

    const result = await chatService.processUserMessage(conversationId, message, {
      userInfo: userContext
    });

    console.log('Resultado del ChatService:', result);

    if (!result.success) {
      console.log('ERROR: ChatService falló', result.error);
      return NextResponse.json({
        success: false,
        message: result.error || 'Error procesando mensaje'
      }, { status: 500 });
    }

    console.log('Procesamiento exitoso, devolviendo respuesta');
    return NextResponse.json({
      success: true,
      message: result.message,
      intent: result.intent,
      sources: result.sources || [],
      processingTime: result.processingTime
    });

  } catch (error) {
    console.error('ERROR CRÍTICO en ruta API:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    }, { status: 500 });
  }
}
