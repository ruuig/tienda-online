// API para procesar mensajes con OpenAI
import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getAuth } from '@clerk/nextjs/server';
import { ChatService } from '@/src/infrastructure/openai/chatService';
import { getSharedRAGService } from '@/src/infrastructure/rag/ragServiceRegistry.js';
import { ConversationPersistenceService } from '@/src/infrastructure/chat/conversationPersistenceService.js';
import Product from '@/src/infrastructure/database/models/productModel.js';

const DEFAULT_VENDOR_ID =
  process.env.DEFAULT_VENDOR_ID ||
  process.env.NEXT_PUBLIC_VENDOR_ID ||
  'default_vendor';

// --- Función auxiliar para validar si un ID es ObjectId válido ---
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// POST /api/chat/process-message - Procesar mensaje con IA
export async function POST(request) {
  try {
    console.log('=== NUEVA SOLICITUD DE CHAT ===');

    await connectDB();
    console.log('Base de datos conectada');

    const { userId, sessionId } = getAuth(request);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Body inválido' },
        { status: 400 }
      );
    }

    const {
      conversationId,
      message,
      userInfo,
      vendorId: vendorIdFromBody,
      sessionId: sessionIdFromBody,
      title,
    } = body || {};

    if (!conversationId || !message) {
      return NextResponse.json(
        { success: false, message: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    const resolvedVendorId = vendorIdFromBody || DEFAULT_VENDOR_ID;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return NextResponse.json(
        { success: false, message: 'Servicio de IA no disponible' },
        { status: 503 }
      );
    }

    // --- 1) Cargar productos del proveedor ---
    let productContext = {};
    try {
      const products = await getProductsForContextFromDB(resolvedVendorId);
      if (products?.length) {
        productContext = {
          products,
          productsSummary: generateProductsSummary(products),
        };
        console.log(`✅ Contexto de productos cargado (${products.length} productos)`);
      } else {
        console.log('⚠️ No se encontraron productos para el contexto');
      }
    } catch (e) {
      console.warn('⚠️ Error obteniendo productos:', e?.message);
    }

    // --- 2) Cargar documentos RAG ---
    const ragService = getSharedRAGService();

    let ragDocuments = [];
    let ragMatches = [];
    try {
      const vendorKey = isValidObjectId(resolvedVendorId) ? resolvedVendorId : null;
      await ragService.ensureIndexLoaded({ vendorId: vendorKey });
      ragDocuments = ragService.getIndexedDocuments(vendorKey);

      if (ragDocuments.length > 0) {
        ragMatches = await ragService.search(message, { vendorId: vendorKey, limit: 5 });
        console.log(`✅ RAG: ${ragMatches.length} coincidencias encontradas`);
      } else {
        console.log('⚠️ No hay documentos RAG activos para el proveedor');
      }
    } catch (ragError) {
      console.warn('⚠️ No se pudo preparar RAG:', ragError?.message);
    }

    // --- 3) Inicializar servicios ---
    const chatService = new ChatService(openaiApiKey);
    const persistenceService = new ConversationPersistenceService();

    // --- 4) Contexto del usuario ---
    const userContext = userId
      ? { id: userId, name: 'Usuario', ...userInfo }
      : { id: 'demo-user', name: 'Usuario Demo', email: 'demo@example.com', ...userInfo };

    const metadataFromRequest = {
      userAgent: request.headers.get('user-agent'),
      ipAddress:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('cf-connecting-ip') ||
        null,
      referrer: request.headers.get('referer') || request.headers.get('referrer') || null,
    };

    // --- 5) Guardar mensaje del usuario ---
    const userMessageResult = await persistenceService.logMessage({
      conversationId,
      vendorId: resolvedVendorId,
      userId: userContext.id,
      sender: 'user',
      content: message,
      type: 'text',
      conversationMetadata: metadataFromRequest,
      sessionId: sessionIdFromBody || sessionId || null,
      title,
    });

    const persistedConversationId =
      userMessageResult?.conversation?._id || conversationId;

    // --- 6) Generar respuesta con contexto (productos + RAG) ---
    const result = await chatService.processUserMessage(
      persistedConversationId,
      message,
      {
        userInfo: userContext,
        vendorId: resolvedVendorId,
        ...productContext,
        ragContext: {
          vendorId: resolvedVendorId,
          documents: ragDocuments,
          matches: ragMatches,
          service: ragService,
        },
      }
    );

    if (!result?.success) {
      return NextResponse.json(
        {
          success: false,
          message: result?.error || 'Error procesando mensaje',
          userMessage: userMessageResult?.message,
          conversation: userMessageResult?.conversation,
        },
        { status: 500 }
      );
    }

    // --- 7) Guardar respuesta del bot ---
    let persistedBotMessage = null;
    if (result.message) {
      const persistenceResponse = await persistenceService.logMessage({
        conversationId: persistedConversationId,
        vendorId: resolvedVendorId,
        userId: userContext.id,
        sender: 'bot',
        content: result.message.content,
        type: result.message.type || 'text',
        messageMetadata: result.message.metadata || {},
        conversationMetadata: metadataFromRequest,
        sessionId: sessionIdFromBody || sessionId || null,
      });
      persistedBotMessage = persistenceResponse?.message || result.message;
    }

    // --- 8) Responder ---
    return NextResponse.json({
      success: true,
      message: persistedBotMessage || result.message,
      userMessage: userMessageResult?.message,
      conversation: userMessageResult?.conversation,
      intent: result.intent,
      sources: result.sources || [],
      processingTime: result.processingTime,
      usedProductContext: !!productContext.products,
      productsCount: productContext.products?.length || 0,
    });
  } catch (error) {
    console.error('ERROR CRÍTICO en ruta API:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Carga productos del proveedor directamente desde MongoDB (seguro ante vendorId inválido)
 */
async function getProductsForContextFromDB(vendorId) {
  try {
    const filter = { status: 'active' };
    if (isValidObjectId(vendorId)) {
      filter.vendorId = vendorId;
    } else {
      console.warn(`⚠️ VendorId inválido (${vendorId}), cargando productos sin filtro`);
    }

    const projection = {
      name: 1,
      category: 1,
      brand: 1,
      offerPrice: 1,
      price: 1,
      description: 1,
      stock: 1,
      inStock: 1,
      quantity: 1,
    };

    const products = await Product.find(filter, projection).lean();
    return products || [];
  } catch (err) {
    console.error('Error obteniendo productos:', err);
    return [];
  }
}

/**
 * Genera resumen de productos
 */
function generateProductsSummary(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return 'No hay productos disponibles en este momento.';
  }

  const categories = [...new Set(products.map((p) => p.category))];
  const categoryNames = {
    smartphone: 'Smartphones',
    laptop: 'Laptops/Computadoras',
    earphone: 'Audífonos/Earphones',
    headphone: 'Headphones/Auriculares',
    watch: 'Relojes Inteligentes',
    camera: 'Cámaras',
    accessories: 'Accesorios',
    tablet: 'Tablets',
    console: 'Consolas',
    gaming: 'Juegos',
    home: 'Hogar',
  };

  const displayCategories = categories.map((cat) => categoryNames[cat] || cat).join(', ');
  const prices = products
    .map((p) => Number(p.offerPrice ?? p.price) || 0)
    .filter((n) => n > 0);
  const priceRange =
    prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null;

  let summary = `Tenemos ${products.length} productos en: ${displayCategories}.`;
  if (priceRange) summary += ` Precios: Q${priceRange.min} a Q${priceRange.max}.`;

  const featured = products.slice(0, 3);
  if (featured.length > 0) {
    summary += `\n\nDestacados:`;
    featured.forEach((p) => {
      const cat = categoryNames[p.category] || p.category || 'General';
      const price = p.offerPrice ?? p.price ?? '—';
      summary += `\n• ${p.name} (${cat}) - Q${price}`;
    });
  }
  return summary;
}
