// API del panel de vendedor para gestión completa del sistema de chat
import { NextResponse } from 'next/server';
import connectDB from '@/src/infrastructure/database/db.js';
import { Document, DocumentChunk, PromptConfig, Conversation, Message } from '@/src/infrastructure/database/models/index.js';
import { createRAGService } from '@/src/infrastructure/rag/ragService.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import pdfParse from 'pdf-parse';

const ragService = createRAGService(process.env.OPENAI_API_KEY);

// TODO: Implementar validación de autenticación de vendedor
const validateVendorAccess = async (request) => {
  // Simular validación por ahora
  return { vendorId: '507f1f77bcf86cd799439011', userId: 'vendor_123' };
};

// API para obtener dashboard del vendedor
export async function GET(request) {
  try {
    await connectDB();

    const auth = await validateVendorAccess(request);
    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'overview';

    switch (section) {
      case 'overview':
        return await getOverviewData(vendorId);

      case 'documents':
        return await getDocumentsData(vendorId, searchParams);

      case 'conversations':
        return await getConversationsData(vendorId, searchParams);

      case 'analytics':
        return await getAnalyticsData(vendorId, searchParams);

      case 'settings':
        return await getSettingsData(vendorId);

      default:
        return NextResponse.json(
          { success: false, message: 'Sección no válida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Error en panel de vendedor:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// API para subir documentos
export async function POST(request) {
  try {
    await connectDB();

    const auth = await validateVendorAccess(request);
    const vendorId = auth.vendorId;

    const formData = await request.formData();
    const file = formData.get('file');
    const category = formData.get('category');
    const description = formData.get('description');

    // Validar campos requeridos
    if (!file || !category) {
      return NextResponse.json(
        { success: false, message: 'Archivo y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, message: 'Solo se permiten archivos PDF' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'El archivo no puede ser mayor a 10MB' },
        { status: 400 }
      );
    }

    // Crear directorio si no existe
    const vendorDir = join(process.cwd(), 'uploads', 'documents', vendorId.toString());
    if (!existsSync(vendorDir)) {
      await mkdir(vendorDir, { recursive: true });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(vendorDir, fileName);

    // Guardar archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Extraer texto del PDF
    let contentText = '';
    try {
      const pdfData = await pdfParse(buffer);
      contentText = pdfData.text;
    } catch (error) {
      console.warn('Error extrayendo texto del PDF:', error);
      contentText = 'Contenido no extraíble automáticamente';
    }

    // Crear documento en MongoDB
    const document = await Document.create({
      vendorId,
      filename: fileName,
      filePath,
      contentText,
      fileSize: file.size,
      category,
      version: 1,
      isActive: true,
      uploadDate: new Date(),
      lastIndexed: null,
      metadata: {
        uploadedBy: auth.userId,
        originalName: file.name,
        mimeType: file.type,
        description
      }
    });

    // Dividir en chunks
    const chunks = ragService.constructor.chunkText(contentText, 500, 50);

    // Guardar chunks
    const chunkDocuments = chunks.map(chunk => ({
      documentId: document._id,
      chunkText: chunk.content,
      chunkIndex: chunk.chunkIndex,
      tokenCount: chunk.tokenCount,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex
    }));

    await DocumentChunk.insertMany(chunkDocuments);

    console.log(`✅ Documento subido por vendedor ${vendorId}: ${fileName}`);

    return NextResponse.json({
      success: true,
      message: 'Documento subido exitosamente',
      document: {
        id: document._id,
        filename: document.filename,
        category: document.category,
        fileSize: document.fileSize,
        chunksCount: chunks.length,
        isIndexed: false
      }
    });

  } catch (error) {
    console.error('❌ Error subiendo documento:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Funciones auxiliares para obtener datos del dashboard
async function getOverviewData(vendorId) {
  // Obtener estadísticas generales
  const [
    documentsStats,
    conversationsStats,
    messagesStats,
    promptConfig
  ] = await Promise.all([
    Document.aggregate([
      { $match: { vendorId } },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          activeDocuments: { $sum: { $cond: ['$isActive', 1, 0] } },
          indexedDocuments: { $sum: { $cond: ['$lastIndexed', 1, 0] } },
          totalSize: { $sum: '$fileSize' }
        }
      }
    ]),

    Conversation.aggregate([
      { $match: { vendorId } },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          activeConversations: { $sum: { $cond: ['$status', 1, 0] } },
          closedConversations: { $sum: { $cond: { $eq: ['$status', 'closed'] }, 1, 0 } }
        }
      }
    ]),

    Message.aggregate([
      { $lookup: { from: 'conversations', localField: 'conversationId', foreignField: '_id', as: 'conversation' } },
      { $match: { 'conversation.vendorId': vendorId } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          userMessages: { $sum: { $cond: ['$role', 1, 0] } },
          assistantMessages: { $sum: { $cond: { $eq: ['$role', 'assistant'] }, 1, 0 } }
        }
      }
    ]),

    PromptConfig.findOne({ vendorId, isActive: true })
  ]);

  const docStats = documentsStats[0] || { totalDocuments: 0, activeDocuments: 0, indexedDocuments: 0, totalSize: 0 };
  const convStats = conversationsStats[0] || { totalConversations: 0, activeConversations: 0, closedConversations: 0 };
  const msgStats = messagesStats[0] || { totalMessages: 0, userMessages: 0, assistantMessages: 0 };

  return NextResponse.json({
    success: true,
    data: {
      documents: {
        total: docStats.totalDocuments,
        active: docStats.activeDocuments,
        indexed: docStats.indexedDocuments,
        totalSize: docStats.totalSize,
        indexationRate: docStats.totalDocuments > 0 ? (docStats.indexedDocuments / docStats.totalDocuments * 100).toFixed(1) : 0
      },
      conversations: {
        total: convStats.totalConversations,
        active: convStats.activeConversations,
        closed: convStats.closedConversations,
        completionRate: convStats.totalConversations > 0 ? (convStats.closedConversations / convStats.totalConversations * 100).toFixed(1) : 0
      },
      messages: {
        total: msgStats.totalMessages,
        user: msgStats.userMessages,
        assistant: msgStats.assistantMessages,
        averagePerConversation: convStats.totalConversations > 0 ? (msgStats.totalMessages / convStats.totalConversations).toFixed(1) : 0
      },
      promptConfig: promptConfig ? {
        id: promptConfig._id,
        version: promptConfig.version,
        updatedAt: promptConfig.updatedAt,
        temperature: promptConfig.temperature,
        maxTokens: promptConfig.maxTokens
      } : null
    }
  });
}

async function getDocumentsData(vendorId, searchParams) {
  const category = searchParams.get('category');
  const isActive = searchParams.get('isActive');
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 10;
  const skip = (page - 1) * limit;

  // Construir filtro
  const filter = { vendorId };
  if (category) filter.category = category;
  if (isActive !== null) filter.isActive = isActive === 'true';

  // Obtener documentos con paginación
  const [documents, totalCount] = await Promise.all([
    Document.find(filter)
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('filename fileSize category version isActive uploadDate lastIndexed metadata'),

    Document.countDocuments(filter)
  ]);

  return NextResponse.json({
    success: true,
    documents: documents.map(doc => ({
      id: doc._id,
      filename: doc.filename,
      fileSize: doc.fileSize,
      category: doc.category,
      version: doc.version,
      isActive: doc.isActive,
      uploadDate: doc.uploadDate,
      lastIndexed: doc.lastIndexed,
      description: doc.metadata?.description,
      isIndexed: !!doc.lastIndexed
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    }
  });
}

async function getConversationsData(vendorId, searchParams) {
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 10;
  const skip = (page - 1) * limit;

  // Construir filtro
  const filter = { vendorId };
  if (status) filter.status = status;

  // Obtener conversaciones con paginación
  const [conversations, totalCount] = await Promise.all([
    Conversation.find(filter)
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limit)
      .select('userId sessionId status startedAt endedAt lastActivity metadata'),

    Conversation.countDocuments(filter)
  ]);

  return NextResponse.json({
    success: true,
    conversations: conversations.map(conv => ({
      id: conv._id,
      userId: conv.userId,
      sessionId: conv.sessionId,
      status: conv.status,
      startedAt: conv.startedAt,
      endedAt: conv.endedAt,
      lastActivity: conv.lastActivity,
      duration: conv.endedAt ? (conv.endedAt - conv.startedAt) : (Date.now() - conv.startedAt),
      userAgent: conv.metadata?.userAgent,
      ipAddress: conv.metadata?.ipAddress
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    }
  });
}

async function getAnalyticsData(vendorId, searchParams) {
  const timeframe = searchParams.get('timeframe') || '7d'; // 7d, 30d, 90d

  // Calcular fecha de inicio según timeframe
  const startDate = new Date();
  switch (timeframe) {
    case '7d': startDate.setDate(startDate.getDate() - 7); break;
    case '30d': startDate.setDate(startDate.getDate() - 30); break;
    case '90d': startDate.setDate(startDate.getDate() - 90); break;
  }

  // Obtener analytics de conversaciones
  const conversationsAnalytics = await Conversation.aggregate([
    { $match: { vendorId, startedAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$startedAt' }
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Obtener analytics de mensajes
  const messagesAnalytics = await Message.aggregate([
    {
      $lookup: {
        from: 'conversations',
        localField: 'conversationId',
        foreignField: '_id',
        as: 'conversation'
      }
    },
    { $match: { 'conversation.vendorId': vendorId, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          role: '$role',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  // Obtener intents más comunes
  const intentsAnalytics = await Message.aggregate([
    {
      $lookup: {
        from: 'conversations',
        localField: 'conversationId',
        foreignField: '_id',
        as: 'conversation'
      }
    },
    { $match: {
      'conversation.vendorId': vendorId,
      'metadata.intent': { $exists: true },
      createdAt: { $gte: startDate }
    }},
    {
      $group: {
        _id: '$metadata.intent',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return NextResponse.json({
    success: true,
    analytics: {
      timeframe,
      conversations: conversationsAnalytics.map(item => ({
        date: item._id,
        count: item.count,
        uniqueUsers: item.uniqueUsers.length
      })),
      messages: messagesAnalytics,
      topIntents: intentsAnalytics.map(item => ({
        intent: item._id,
        count: item.count
      }))
    }
  });
}

async function getSettingsData(vendorId) {
  // Obtener configuración actual de prompts
  const promptConfig = await PromptConfig.findOne({ vendorId, isActive: true });

  // Obtener estadísticas del sistema RAG
  const ragStats = ragService.getStats();

  return NextResponse.json({
    success: true,
    settings: {
      promptConfig: promptConfig ? {
        id: promptConfig._id,
        systemPrompt: promptConfig.systemPrompt,
        greetingMessage: promptConfig.greetingMessage,
        rejectionMessage: promptConfig.rejectionMessage,
        allowedTopics: promptConfig.allowedTopics,
        temperature: promptConfig.temperature,
        maxTokens: promptConfig.maxTokens,
        model: promptConfig.model,
        version: promptConfig.version,
        updatedAt: promptConfig.updatedAt
      } : null,
      ragStats,
      systemInfo: {
        mongodb: true,
        redis: true,
        openai: !!process.env.OPENAI_API_KEY,
        websocket: true
      }
    }
  });
}
