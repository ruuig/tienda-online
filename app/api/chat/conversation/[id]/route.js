import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { ConversationRepositoryImpl, MessageRepositoryImpl } from '@/src/infrastructure/database/repositories';
import { getAuthUser } from '@/lib/auth';

// GET /api/chat/conversation/[id] - Obtener conversación específica con mensajes
export async function GET(request, { params }) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    const conversationRepository = new ConversationRepositoryImpl();
    const messageRepository = new MessageRepositoryImpl();

    // Verificar que la conversación pertenece al usuario
    const conversation = await conversationRepository.findById(id);
    if (!conversation) {
      return NextResponse.json({
        success: false,
        message: 'Conversación no encontrada'
      }, { status: 404 });
    }

    if (conversation.userId !== user.id) {
      return NextResponse.json({
        success: false,
        message: 'No tienes permiso para ver esta conversación'
      }, { status: 403 });
    }

    // Obtener mensajes de la conversación
    const messages = await messageRepository.findByConversationId(id);

    return NextResponse.json({
      success: true,
      conversation,
      messages: messages || []
    });

  } catch (error) {
    console.error('Error al obtener conversación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
