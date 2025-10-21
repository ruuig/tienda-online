import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { ConversationRepositoryImpl } from '@/src/infrastructure/database/repositories';
import { getAuthUser } from '@/lib/auth';

// GET /api/chat/conversation/active - Obtener conversaciones activas del usuario
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const conversationRepository = new ConversationRepositoryImpl();
    const conversations = await conversationRepository.findActiveByUser(user.id);

    return NextResponse.json({
      success: true,
      conversations: conversations || []
    });

  } catch (error) {
    console.error('Error al obtener conversaciones activas:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
