import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { requireSeller } from '@/lib/auth';
import { Conversation, Message } from '@/src/infrastructure/database/models/index.js';

function serializeConversation(conversation) {
  if (!conversation) return null;
  const plain = conversation.toObject ? conversation.toObject() : conversation;
  const serializeDate = (value) => (value instanceof Date ? value.toISOString() : value);

  return {
    id: plain._id?.toString(),
    userId: plain.userId,
    vendorId: plain.vendorId,
    sessionId: plain.sessionId,
    title: plain.title,
    status: plain.status,
    priority: plain.priority,
    assignedTo: plain.assignedTo,
    tags: plain.tags || [],
    messageCount: plain.messageCount || 0,
    isPersisted: !!plain.isPersisted,
    lastMessagePreview: plain.lastMessagePreview || '',
    lastMessageSender: plain.lastMessageSender || null,
    metadata: plain.metadata || {},
    startedAt: serializeDate(plain.startedAt),
    endedAt: serializeDate(plain.endedAt),
    lastActivity: serializeDate(plain.lastActivity),
    createdAt: serializeDate(plain.createdAt),
    updatedAt: serializeDate(plain.updatedAt)
  };
}

function serializeMessage(message) {
  if (!message) return null;
  const plain = message.toObject ? message.toObject() : message;
  const serializeDate = (value) => (value instanceof Date ? value.toISOString() : value);

  return {
    id: plain._id?.toString(),
    conversationId: plain.conversationId?.toString(),
    content: plain.content,
    sender: plain.sender,
    type: plain.type,
    metadata: plain.metadata || {},
    isRead: plain.isRead,
    readBy: plain.readBy || [],
    createdAt: serializeDate(plain.createdAt),
    updatedAt: serializeDate(plain.updatedAt)
  };
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const auth = await requireSeller(request);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.user ? 403 : 401 });
    }

    const { user } = auth;
    const vendorId = user.vendorId || process.env.DEFAULT_VENDOR_ID || 'default_vendor';

    const { searchParams } = new URL(request.url);
    const includeMessages = searchParams.get('includeMessages') === 'true';
    const messageLimit = Math.min(Math.max(parseInt(searchParams.get('limit') || '200', 10), 1), 500);

    const conversation = await Conversation.findOne({ _id: params.id, vendorId });

    if (!conversation) {
      return NextResponse.json({ success: false, message: 'Conversación no encontrada' }, { status: 404 });
    }

    let messages = [];
    if (includeMessages) {
      const docs = await Message.find({ conversationId: params.id })
        .sort({ createdAt: 1 })
        .limit(messageLimit);
      messages = docs.map(serializeMessage);
    }

    return NextResponse.json({
      success: true,
      conversation: serializeConversation(conversation),
      messages
    });
  } catch (error) {
    console.error('Error obteniendo conversación de vendedor:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const auth = await requireSeller(request);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.user ? 403 : 401 });
    }

    const { user } = auth;
    const vendorId = user.vendorId || process.env.DEFAULT_VENDOR_ID || 'default_vendor';

    const payload = await request.json();
    const update = {};

    if (payload.status) {
      update.status = payload.status;
      if (payload.status === 'closed') {
        update.endedAt = new Date();
      }
    }

    if (payload.priority) {
      update.priority = payload.priority;
    }

    if (payload.assignedTo !== undefined) {
      update.assignedTo = payload.assignedTo;
    }

    if (Array.isArray(payload.tags)) {
      update.tags = payload.tags;
    }

    if (payload.title) {
      update.title = payload.title;
    }

    if (payload.metadata && typeof payload.metadata === 'object') {
      update.metadata = payload.metadata;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, message: 'No se proporcionaron cambios válidos' }, { status: 400 });
    }

    update.updatedAt = new Date();

    const conversation = await Conversation.findOneAndUpdate(
      { _id: params.id, vendorId },
      update,
      { new: true }
    );

    if (!conversation) {
      return NextResponse.json({ success: false, message: 'Conversación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation: serializeConversation(conversation)
    });
  } catch (error) {
    console.error('Error actualizando conversación de vendedor:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
