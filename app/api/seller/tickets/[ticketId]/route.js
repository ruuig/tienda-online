import connectDB from '@/config/db';
import authSeller from '@/lib/authSeller';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Ticket from '@/src/infrastructure/database/models/ticketModel';

const ALLOWED_STATUSES = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'escalated'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const ALLOWED_CATEGORIES = ['technical', 'billing', 'orders', 'account', 'products', 'shipping', 'returns', 'other'];

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function ensureSeller(request) {
  const { userId } = getAuth(request);
  if (!userId) {
    return { error: NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 }) };
  }

  const isSeller = await authSeller(userId);
  if (!isSeller) {
    return { error: NextResponse.json({ success: false, message: 'No autorizado' }, { status: 403 }) };
  }

  return { userId };
}

export async function GET(request, { params }) {
  try {
    const authResult = await ensureSeller(request);
    if (authResult.error) {
      return authResult.error;
    }

    await connectDB();

    const { ticketId } = params;
    if (!isValidObjectId(ticketId)) {
      return NextResponse.json({ success: false, message: 'Identificador inválido' }, { status: 400 });
    }

    const ticket = await Ticket.findById(ticketId).lean();
    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error(`Error obteniendo ticket ${params?.ticketId}:`, error);
    return NextResponse.json({ success: false, message: 'Error al obtener el ticket', error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const authResult = await ensureSeller(request);
    if (authResult.error) {
      return authResult.error;
    }

    await connectDB();

    const { ticketId } = params;
    if (!isValidObjectId(ticketId)) {
      return NextResponse.json({ success: false, message: 'Identificador inválido' }, { status: 400 });
    }

    const payload = await request.json();
    const allowedFields = ['status', 'priority', 'assignedTo', 'tags', 'resolution', 'metadata', 'title', 'description', 'category', 'satisfaction'];
    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        if (field === 'tags' && payload[field] && !Array.isArray(payload[field])) {
          return NextResponse.json({ success: false, message: 'tags debe ser un arreglo' }, { status: 400 });
        }
        if (field === 'status' && payload[field] && !ALLOWED_STATUSES.includes(payload[field])) {
          return NextResponse.json({ success: false, message: 'Estado de ticket no permitido' }, { status: 400 });
        }
        if (field === 'priority' && payload[field] && !ALLOWED_PRIORITIES.includes(payload[field])) {
          return NextResponse.json({ success: false, message: 'Prioridad no permitida' }, { status: 400 });
        }
        if (field === 'category' && payload[field] && !ALLOWED_CATEGORIES.includes(payload[field])) {
          return NextResponse.json({ success: false, message: 'Categoría no permitida' }, { status: 400 });
        }
        updates[field] = payload[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, message: 'No se recibieron campos válidos para actualizar' }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, { $set: updates }, { new: true }).lean();

    if (!updatedTicket) {
      return NextResponse.json({ success: false, message: 'Ticket no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error(`Error actualizando ticket ${params?.ticketId}:`, error);
    return NextResponse.json({ success: false, message: 'Error al actualizar el ticket', error: error.message }, { status: 500 });
  }
}
