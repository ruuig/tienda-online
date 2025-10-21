import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { TicketRepositoryImpl } from '@/src/infrastructure/database/repositories';
import { getAuthUser } from '@/lib/auth';

// GET /api/chat/ticket - Obtener tickets del usuario
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const ticketRepository = new TicketRepositoryImpl();

    // Si es admin, puede ver todos los tickets; si es usuario normal, solo los suyos
    let tickets;
    if (user.isAdmin) {
      tickets = await ticketRepository.findAll(filters);
    } else {
      tickets = await ticketRepository.findByUserId(user.id);
    }

    return NextResponse.json({
      success: true,
      tickets: tickets || []
    });

  } catch (error) {
    console.error('Error al obtener tickets:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST /api/chat/ticket - Crear nuevo ticket
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { conversationId, title, description, category, priority = 'medium' } = await request.json();

    if (!title || !description || !category) {
      return NextResponse.json({
        success: false,
        message: 'Faltan datos requeridos'
      }, { status: 400 });
    }

    const ticketRepository = new TicketRepositoryImpl();

    const ticketData = {
      conversationId,
      userId: user.id,
      title,
      description,
      category,
      priority,
      status: 'open',
      createdAt: new Date()
    };

    const ticket = await ticketRepository.create(ticketData);

    return NextResponse.json({
      success: true,
      ticket
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear ticket:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
