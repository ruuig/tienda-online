// API para procesar mensajes con OpenAI
import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getAuth } from '@clerk/nextjs/server';
import { ChatService } from '@/src/infrastructure/openai/chatService';
import { DocumentRepositoryImpl } from '@/src/infrastructure/database/repositories.js';
import { RAGService } from '@/src/infrastructure/rag/ragService.js';
import { ConversationPersistenceService } from '@/src/infrastructure/chat/conversationPersistenceService.js';
import Product from '@/src/infrastructure/database/models/productModel.js';
import { productContextService } from '@/src/services/productContextService.js';

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
      const products = await searchProductsForMessage(message, resolvedVendorId, 8);
      if (products?.length) {
        productContext = {
          products,
          productsSummary: generateProductsSummary(products),
        };

        try {
          await productContextService.initialize(products);
        } catch (serviceError) {
          console.warn(
            '⚠️ No se pudo inicializar el servicio de contexto de productos:',
            serviceError?.message
          );
        }

        console.log(`✅ Contexto de productos cargado (${products.length} productos)`);
      } else {
        console.log('⚠️ No se encontraron productos relevantes para el contexto');
      }
    } catch (e) {
      console.warn('⚠️ Error obteniendo productos:', e?.message);
    }

    // --- 2) Cargar documentos RAG ---
    const documentRepository = new DocumentRepositoryImpl();
    const ragService = new RAGService(documentRepository);

    let ragDocuments = [];
    let ragMatches = [];
    try {
      const ragFilter = { isActive: true };
      if (isValidObjectId(resolvedVendorId)) {
        ragFilter.vendorId = resolvedVendorId;
      }

      ragDocuments = await documentRepository.findAll(ragFilter);

      if (ragDocuments.length > 0) {
        await ragService.buildIndex(ragDocuments);
        ragMatches = await ragService.search(message, 5);
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
async function searchProductsForMessage(userMessage, vendorId, limit = 8) {
  const baseFilter = { status: 'active' };
  if (isValidObjectId(vendorId)) {
    baseFilter.vendorId = vendorId;
  } else if (vendorId) {
    console.warn(`⚠️ VendorId inválido (${vendorId}), la búsqueda se realizará sin filtro por proveedor`);
  }

  const normalizedMessage = normalizeText(userMessage || '');
  const detectedCategories = detectCategories(normalizedMessage);
  const searchTokens = extractSearchTokens(normalizedMessage);

  const filter = { ...baseFilter };
  if (detectedCategories.length > 0) {
    filter.category = { $in: detectedCategories };
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

  let products = [];
  const searchRegex = buildSearchRegex(searchTokens);
  const queryFilter = { ...filter };

  if (searchRegex) {
    queryFilter.$or = [
      { name: { $regex: searchRegex } },
      { brand: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
    ];
  }

  try {
    const query = Product.find(queryFilter, projection).limit(limit);
    products = await query.lean();
  } catch (err) {
    console.warn('⚠️ Error ejecutando búsqueda de productos principal:', err?.message);
    products = [];
  }

  if (!products.length && searchRegex) {
    try {
      const fallbackQuery = Product.find(filter, projection)
        .sort({ createdAt: -1 })
        .limit(limit);
      products = await fallbackQuery.lean();
    } catch (fallbackError) {
      console.warn('⚠️ Error ejecutando búsqueda de productos de respaldo:', fallbackError?.message);
    }
  }

  return Array.isArray(products) ? products : [];
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

  const details = products.map((p, index) => {
    const cat = categoryNames[p.category] || p.category || 'General';
    const price = p.offerPrice ?? p.price ?? '—';
    const availability =
      p.inStock === false || p.stock === 0 || p.quantity === 0 ? 'Agotado' : 'Disponible';
    return `${index + 1}. ${p.name} (${cat}) - Q${price} (${availability})`;
  });

  summary += `\n\nProductos relevantes para esta consulta:\n${details.join('\n')}`;
  return summary;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

const CATEGORY_KEYWORDS = {
  smartphone: ['smartphone', 'telefono', 'celular', 'iphone', 'android', 'galaxy'],
  laptop: ['laptop', 'computadora', 'notebook', 'portatil', 'macbook'],
  earphone: ['audifono', 'earphone', 'auricular', 'in-ear', 'earbud'],
  headphone: ['headphone', 'auricular de diadema', 'over-ear', 'diadema'],
  watch: ['reloj', 'smartwatch', 'watch', 'banda'],
  camera: ['camara', 'camera', 'fotografica', 'dslr'],
  accessories: ['accesorio', 'accesorios', 'cable', 'cargador', 'funda'],
  tablet: ['tablet', 'ipad'],
  console: ['consola', 'playstation', 'xbox', 'nintendo', 'switch'],
  gaming: ['gaming', 'videojuego', 'juego'],
  home: ['hogar', 'smart home', 'casa', 'iluminacion'],
};

function detectCategories(normalizedMessage) {
  if (!normalizedMessage) return [];
  const categories = [];
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalizedMessage.includes(keyword))) {
      categories.push(category);
    }
  }
  return categories;
}

const STOP_WORDS = new Set([
  'que',
  'para',
  'como',
  'unos',
  'unas',
  'tengo',
  'tienes',
  'tienen',
  'quiero',
  'cuales',
  'cual',
  'hay',
  'hola',
  'buenos',
  'dias',
  'tardes',
  'noches',
  'sobre',
  'del',
  'los',
  'las',
  'una',
  'por',
  'mas',
  'me',
  'pueden',
  'puedo',
  'ver',
  'informacion',
  'buscar',
  'buscando',
  'disponibles',
  'tienen',
  'ofrecen',
]);

function extractSearchTokens(normalizedMessage) {
  return Array.from(new Set(normalizedMessage.split(/[^a-z0-9]+/)))
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function buildSearchRegex(tokens) {
  if (!tokens?.length) return null;
  const pattern = tokens
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  return pattern ? new RegExp(pattern, 'i') : null;
}

export { searchProductsForMessage, generateProductsSummary };
