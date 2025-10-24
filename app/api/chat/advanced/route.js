// API principal del chat con RAG avanzado y verificación de BD
import { NextResponse } from 'next/server';
import connectDB from '@/src/infrastructure/database/db.js';
import { createChatService } from '@/src/infrastructure/openai/chatService.js';

const chatService = createChatService(process.env.OPENAI_API_KEY);

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      message,
      conversationId,
      userId,
      vendorId,
      userAgent,
      ipAddress
    } = body;

    // Validaciones básicas
    if (!message || !conversationId || !vendorId) {
      return NextResponse.json(
        { success: false, message: 'Mensaje, conversationId y vendorId son requeridos' },
        { status: 400 }
      );
    }

    // Inicializar servicio para el vendedor si es necesario
    await chatService.initializeForVendor(vendorId);

    // Preparar contexto para el chat
    const context = {
      vendorId,
      userId: userId || 'anonymous',
      userAgent,
      ipAddress
    };

    // Procesar mensaje con el sistema avanzado
    const result = await chatService.processUserMessage(conversationId, message, context);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error procesando el mensaje',
          error: result.error
        },
        { status: 500 }
      );
    }

    console.log('✅ Mensaje procesado exitosamente:', {
      conversationId,
      vendorId,
      intent: result.intent.intent,
      processingTime: result.processingTime,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      intent: result.intent,
      sources: result.sources,
      processingTime: result.processingTime,
      stats: await chatService.getStats()
    });

  } catch (error) {
    console.error('❌ Error en API de chat:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const conversationId = searchParams.get('conversationId');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, message: 'VendorId es requerido' },
        { status: 400 }
      );
    }

    // Inicializar servicio para el vendedor
    await chatService.initializeForVendor(vendorId);

    // Obtener estadísticas
    const stats = await chatService.getStats();

    let conversationHistory = null;
    if (conversationId) {
      // TODO: Implementar obtener historial de conversación específico
      conversationHistory = {
        conversationId,
        messages: [],
        summary: {
          totalMessages: 0,
          userMessages: 0,
          botMessages: 0,
          intents: {},
          topics: []
        }
      };
    }

    return NextResponse.json({
      success: true,
      stats,
      conversationHistory,
      initialized: chatService.initialized
    });

  } catch (error) {
    console.error('❌ Error obteniendo información del chat:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      },
      { status: 500 }
    );
  }
}
