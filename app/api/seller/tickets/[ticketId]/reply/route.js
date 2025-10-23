import connectDB from '@/config/db';
import authSeller from '@/lib/authSeller';
import { sendSmtpMail } from '@/lib/mail/smtpClient';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Ticket from '@/src/infrastructure/database/models/ticketModel';
import Message from '@/src/infrastructure/database/models/messageModel';
import Conversation from '@/src/infrastructure/database/models/conversationModel';

const MESSAGE_PREVIEW_LENGTH = 200;
const ALLOWED_STATUSES = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'escalated'];

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

async function fetchClerkEmail(userId) {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const primary = user?.primaryEmailAddress?.emailAddress;
    if (primary) {
      return primary;
    }
    return user?.emailAddresses?.[0]?.emailAddress || null;
  } catch (error) {
    console.warn('No se pudo obtener el correo del usuario desde Clerk:', error);
    return null;
  }
}

export async function POST(request, { params }) {
  try {
    const authResult = await ensureSeller(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { ticketId } = params;
    if (!isValidObjectId(ticketId)) {
      return NextResponse.json({ success: false, message: 'Identificador inválido' }, { status: 400 });
    }

    const { message, notifyUser = true, subject, status, html } = await request.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ success: false, message: 'El mensaje es obligatorio' }, { status: 400 });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: 'Estado de ticket no permitido' }, { status: 400 });
    }

    await connectDB();

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket no encontrado' }, { status: 404 });
    }

    const now = new Date();
    const trimmedMessage = message.trim();

    const [createdMessage] = await Promise.all([
      Message.create({
        conversationId: ticket.conversationId,
        content: trimmedMessage,
        sender: 'admin',
        type: 'text',
        metadata: { adminId: authResult.userId },
        createdAt: now,
        updatedAt: now,
      }),
      Conversation.findByIdAndUpdate(
        ticket.conversationId,
        {
          $inc: { messageCount: 1 },
          $set: {
            lastActivity: now,
            lastMessageSender: 'admin',
            lastMessagePreview: trimmedMessage.slice(0, MESSAGE_PREVIEW_LENGTH),
            updatedAt: now,
          },
        },
        { new: true }
      ),
    ]);

    let updatedTicket;
    if (status) {
      ticket.status = status;
      ticket.updatedAt = now;
      updatedTicket = await ticket.save();
    } else {
      updatedTicket = await Ticket.findByIdAndUpdate(ticketId, { $set: { updatedAt: now } }, { new: true });
    }

    let emailInfo = null;
    if (notifyUser) {
      const emailAddress = await fetchClerkEmail(ticket.userId);
      if (!emailAddress) {
        console.warn(`El ticket ${ticketId} no tiene correo asociado para notificar al usuario`);
      } else {
        const mailSubject = subject || `Respuesta a tu ticket: ${ticket.title}`;
        try {
          emailInfo = await sendSmtpMail({
            to: emailAddress,
            subject: mailSubject,
            text: trimmedMessage,
            fromName: 'Soporte',
            html,
            replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_USER,
          });
        } catch (mailError) {
          console.error('Error enviando correo de respuesta:', mailError);
          return NextResponse.json({
            success: false,
            message: 'La respuesta se guardó pero no se pudo enviar el correo',
            error: mailError.message,
            messageRecord: createdMessage,
          }, { status: 502 });
        }
      }
    }

    const messageRecord = createdMessage?.toObject ? createdMessage.toObject() : createdMessage;
    const ticketRecord = updatedTicket?.toObject ? updatedTicket.toObject() : updatedTicket;

    const responsePayload = {
      success: true,
      message: messageRecord,
      ticket: ticketRecord,
    };

    if (emailInfo) {
      responsePayload.email = { id: emailInfo.messageId, accepted: emailInfo.accepted, rejected: emailInfo.rejected };
    }

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error) {
    console.error(`Error respondiendo ticket ${params?.ticketId}:`, error);
    return NextResponse.json({ success: false, message: 'Error al responder el ticket', error: error.message }, { status: 500 });
  }
}
