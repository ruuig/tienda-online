import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { ConversationRepositoryImpl, MessageRepositoryImpl } from '@/src/infrastructure/database/repositories';
import { CreateConversationUseCase } from '@/src/application/use-cases/chatUseCases';
import { getAuthUser } from '@/lib/auth';

// GET /api/chat/conversation - Obtener conversaciones del usuario
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const conversationRepository = new ConversationRepositoryImpl();
    const conversations = await conversationRepository.findByUserId(user.id);

    return NextResponse.json({
      success: true,
      conversations: conversations || []
    });

  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST /api/chat/conversation - Crear nueva conversación
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { title, initialMessage } = await request.json();

    const conversationRepository = new ConversationRepositoryImpl();
    const messageRepository = new MessageRepositoryImpl();

    // Crear caso de uso
    const createConversationUseCase = new CreateConversationUseCase(conversationRepository, messageRepository);

    const result = await createConversationUseCase.execute(user.id, title, initialMessage);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      conversation: result.conversation,
      message: result.message
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear conversación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
