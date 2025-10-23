import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { requireSeller } from '@/lib/auth';
import { Conversation } from '@/src/infrastructure/database/models/index.js';

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

export async function GET(request) {
  try {
    console.log('API: Conversations GET request received');
    await connectDB();

    const auth = await requireSeller(request);
    console.log('Auth result:', auth);

    if (!auth.authorized) {
      console.log('Auth failed:', auth.message);
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.user ? 403 : 401 });
    }

    const { user } = auth;
    const vendorId = user.vendorId || process.env.DEFAULT_VENDOR_ID || 'default_vendor';
    console.log('Authenticated user:', { id: user.id, role: user.role, vendorId });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const minMessagesParam = searchParams.get('minMessages');
    const persistedOnlyParam = searchParams.get('persistedOnly');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const query = { vendorId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (persistedOnlyParam !== null) {
      query.isPersisted = persistedOnlyParam === 'true';
    } else {
      query.isPersisted = true;
    }

    const minMessages = minMessagesParam !== null ? parseInt(minMessagesParam, 10) : Number.NaN;
    if (!Number.isNaN(minMessages)) {
      query.messageCount = { $gte: Math.max(minMessages, 0) };
    } else if (query.isPersisted) {
      query.messageCount = { $gte: 4 };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { sessionId: { $regex: search, $options: 'i' } },
        { 'metadata.ipAddress': { $regex: search, $options: 'i' } },
        { 'metadata.userAgent': { $regex: search, $options: 'i' } }
      ];
    }

    const [conversations, total, activeCount, escalatedCount, closedCount] = await Promise.all([
      Conversation.find(query)
        .sort({ lastActivity: -1 })
        .skip(skip)
        .limit(limit),
      Conversation.countDocuments(query),
      Conversation.countDocuments({ vendorId, status: 'active', isPersisted: true }),
      Conversation.countDocuments({ vendorId, status: 'escalated', isPersisted: true }),
      Conversation.countDocuments({ vendorId, status: 'closed', isPersisted: true })
    ]);

    const mapped = conversations.map(serializeConversation);

    return NextResponse.json({
      success: true,
      conversations: mapped,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        active: activeCount,
        escalated: escalatedCount,
        closed: closedCount,
        total: activeCount + escalatedCount + closedCount
      }
    });
  } catch (error) {
    console.error('Error obteniendo conversaciones de vendedor:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
