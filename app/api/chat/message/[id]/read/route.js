import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { MessageRepositoryImpl } from '@/src/infrastructure/database/repositories';
import { getAuthUser } from '@/lib/auth';

// POST /api/chat/message/[id]/read - Marcar mensaje como leído
export async function POST(request, { params }) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID de mensaje requerido'
      }, { status: 400 });
    }

    const messageRepository = new MessageRepositoryImpl();
    await messageRepository.markAsRead(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'Mensaje marcado como leído'
    });

  } catch (error) {
    console.error('Error marcando mensaje como leído:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
