// Endpoint simplificado para respuestas ultra-rápidas
import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ChatService } from '@/src/infrastructure/openai/chatService';

const DEFAULT_VENDOR_ID = process.env.DEFAULT_VENDOR_ID || process.env.NEXT_PUBLIC_VENDOR_ID || 'default_vendor';

// POST /api/chat/fast-message - Respuestas ultra-rápidas sin contexto complejo
export async function POST(request) {
  const startTime = Date.now();

  try {
    console.log('=== CHAT RÁPIDO ===');

    await connectDB();

    const { userId, user } = getAuth(request);
    const { conversationId, message } = await request.json();

    if (!conversationId || !message) {
      return NextResponse.json({
        success: false,
        message: 'Faltan datos requeridos'
      }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({
        success: false,
        message: 'Servicio de IA no disponible'
      }, { status: 503 });
    }

    // Respuesta ultra-rápida sin contexto de productos ni RAG
    const chatService = new ChatService(openaiApiKey);
    const result = await chatService.processFastMessage(conversationId, message);

    const responseTime = Date.now() - startTime;
    console.log(`✅ Respuesta rápida generada en ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      message: result.message,
      intent: result.intent,
      processingTime: responseTime,
      mode: 'fast'
    });

  } catch (error) {
    console.error('ERROR en chat rápido:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    }, { status: 500 });
  }
}
