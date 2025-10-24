import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { TicketRepositoryImpl } from '@/src/infrastructure/database/repositories';

// GET /api/chat/ticket - Obtener tickets del usuario
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const priority = searchParams.get('priority');
    const showAll = searchParams.get('all') === 'true';
    const source = searchParams.get('source');

    const filters = {};
    if (statusParam) {
      const statusList = statusParam.split(',').map((value) => value.trim()).filter(Boolean);
      if (statusList.length > 1) {
        filters.status = { $in: statusList };
      } else if (statusList.length === 1) {
        filters.status = statusList[0];
      }
    }
    if (priority) filters.priority = priority;
    if (source) filters.source = source;

    const ticketRepository = new TicketRepositoryImpl();
    const tickets = await ticketRepository.findAll(filters);

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
      userId: 'anonymous',
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
