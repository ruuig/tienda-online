import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { MessageRepositoryImpl } from '@/src/infrastructure/database/repositories';
import { getAuthUser } from '@/lib/auth';

// GET /api/chat/message?conversationId=123 - Obtener mensajes de una conversación
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({
        success: false,
        message: 'conversationId es requerido'
      }, { status: 400 });
    }

    const messageRepository = new MessageRepositoryImpl();
    const messages = await messageRepository.findByConversationId(conversationId);

    return NextResponse.json({
      success: true,
      messages: messages || []
    });

  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST /api/chat/message - Crear nuevo mensaje
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { conversationId, content, type = 'text' } = await request.json();

    if (!conversationId || !content) {
      return NextResponse.json({
        success: false,
        message: 'Faltan datos requeridos'
      }, { status: 400 });
    }

    const messageRepository = new MessageRepositoryImpl();

    const messageData = {
      conversationId,
      content,
      sender: 'user',
      type,
      createdAt: new Date()
    };

    const message = await messageRepository.create(messageData);

    return NextResponse.json({
      success: true,
      message
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear mensaje:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
