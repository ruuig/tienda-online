import connectDB from '@/config/db';
import authSeller from '@/lib/authSeller';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Ticket from '@/src/infrastructure/database/models/ticketModel';

function buildTicketFilters(searchParams) {
  const filters = {};

  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const category = searchParams.get('category');
  const assignedTo = searchParams.get('assignedTo');
  const userId = searchParams.get('userId');
  const search = searchParams.get('search');

  if (status) {
    filters.status = status;
  }

  if (priority) {
    filters.priority = priority;
  }

  if (category) {
    filters.category = category;
  }

  if (assignedTo) {
    filters.assignedTo = assignedTo;
  }

  if (userId) {
    filters.userId = userId;
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filters.$or = [
      { title: regex },
      { description: regex },
      { tags: regex },
    ];
  }

  return filters;
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);

    const filters = buildTicketFilters(searchParams);

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(filters),
    ]);

    const response = NextResponse.json({
      success: true,
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error listando tickets:', error);
    return NextResponse.json({ success: false, message: 'Error al listar tickets', error: error.message }, { status: 500 });
  }
}
