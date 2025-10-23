// API para procesar mensajes con OpenAI
import connectDB from '@/config/db';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ChatService } from '@/src/infrastructure/openai/chatService';
import { DocumentRepositoryImpl } from '@/src/infrastructure/database/repositories.js';
import { RAGService } from '@/src/infrastructure/rag/ragService.js';
import { productContextService } from '@/src/services/productContextService';
import { ConversationPersistenceService } from '@/src/infrastructure/chat/conversationPersistenceService.js';

const DEFAULT_VENDOR_ID = process.env.DEFAULT_VENDOR_ID || process.env.NEXT_PUBLIC_VENDOR_ID || 'default_vendor';

// POST /api/chat/process-message - Procesar mensaje con IA
export async function POST(request) {
  try {
    console.log('=== NUEVA SOLICITUD DE CHAT ===');

    await connectDB();
    console.log('Base de datos conectada');

    // Obtener usuario autenticado directamente desde Clerk (opcional para pruebas)
    const { userId, user } = getAuth(request);
    console.log('Usuario autenticado:', { userId, user: !!user });

    const body = await request.json();
    console.log('Datos recibidos:', body);

    const { conversationId, message, userInfo, vendorId: vendorIdFromBody, sessionId } = body;

    if (!conversationId || !message) {
      console.log('ERROR: Datos faltantes', { conversationId, message: !!message });
      return NextResponse.json({
        success: false,
        message: 'Faltan datos requeridos'
      }, { status: 400 });
    }

    const resolvedVendorId = vendorIdFromBody || user?.publicMetadata?.vendorId || DEFAULT_VENDOR_ID;

    // Obtener clave de OpenAI desde variables de entorno
    const openaiApiKey = process.env.OPENAI_API_KEY;
    console.log('API Key de OpenAI:', !!openaiApiKey ? 'Configurada' : 'NO CONFIGURADA');

    if (!openaiApiKey) {
      console.log('ERROR: API Key de OpenAI no configurada');
      return NextResponse.json({
        success: false,
        message: 'Servicio de IA no disponible'
      }, { status: 503 });
    }

    console.log('Procesando mensaje con ChatService...');

    // Log conversationId para debugging
    console.log('Conversation ID recibido:', conversationId);
    console.log('Session ID recibido:', sessionId);

    // Obtener productos para contexto (si están disponibles)
    let productContext = {};
    try {
      // Intentar obtener productos del contexto global o base de datos
      const products = await getProductsForContext();
      if (products && products.length > 0) {
        productContext = {
          products: products,
          productsSummary: generateProductsSummary(products)
        };
        console.log(`✅ Contexto de productos obtenido: ${products.length} productos`);
      } else {
        console.log('⚠️ No se encontraron productos para el contexto');
      }
    } catch (error) {
      console.warn('⚠️ No se pudo obtener contexto de productos:', error.message);
    }

    // Preparar contexto RAG del proveedor
    const documentRepository = new DocumentRepositoryImpl();
    const ragService = new RAGService(documentRepository);
    let ragDocuments = [];
    let ragMatches = [];

    try {
      ragDocuments = await documentRepository.findAll({
        isActive: true,
        vendorId: resolvedVendorId
      });

      if (ragDocuments.length > 0) {
        await ragService.buildIndex(ragDocuments);
        ragMatches = await ragService.search(message, 5);
        console.log(`✅ Contexto RAG obtenido: ${ragMatches.length} coincidencias`);
      } else {
        console.log('⚠️ No se encontraron documentos RAG activos para el proveedor');
      }
    } catch (ragError) {
      console.warn('⚠️ No se pudo preparar el contexto RAG:', ragError.message);
    }

    // Crear servicio de chat
    const chatService = new ChatService(openaiApiKey);
    const persistenceService = new ConversationPersistenceService();

    // Procesar mensaje con IA (usar usuario autenticado si existe, sino usuario por defecto)
    const userContext = user ? {
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.primaryEmailAddress?.emailAddress,
      ...userInfo
    } : {
      id: 'demo-user',
      name: 'Usuario Demo',
      email: 'demo@example.com',
      ...userInfo
    };

    const metadataFromRequest = {
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('cf-connecting-ip') || null,
      referrer: request.headers.get('referer') || request.headers.get('referrer') || null
    };

    console.log('Llamando a persistenceService.logMessage...');
    const userMessageResult = await persistenceService.logMessage({
      conversationId,
      vendorId: resolvedVendorId,
      userId: userContext.id,
      sender: 'user',
      content: message,
      type: 'text',
      conversationMetadata: metadataFromRequest,
      sessionId,
      title: body?.title
    });

    console.log('Resultado de logMessage:', userMessageResult);
    const persistedConversationId = userMessageResult.conversation?._id || conversationId;

    const result = await chatService.processUserMessage(persistedConversationId, message, {
      userInfo: userContext,
      ...productContext,
      ragContext: {
        vendorId: resolvedVendorId,
        documents: ragDocuments,
        matches: ragMatches,
        service: ragService
      }
    });

    console.log('Resultado del ChatService:', result);

    if (!result.success) {
      console.log('ERROR: ChatService falló', result.error);
      return NextResponse.json({
        success: false,
        message: result.error || 'Error procesando mensaje',
        userMessage: userMessageResult.message,
        conversation: userMessageResult.conversation
      }, { status: 500 });
    }

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
        sessionId
      });

      persistedBotMessage = persistenceResponse.message;
    }

    console.log('Procesamiento exitoso, devolviendo respuesta');
    return NextResponse.json({
      success: true,
      message: persistedBotMessage || result.message,
      userMessage: userMessageResult.message,
      conversation: userMessageResult.conversation,
      intent: result.intent,
      sources: result.sources || [],
      processingTime: result.processingTime,
      usedProductContext: !!productContext.products,
      productsCount: productContext.products?.length || 0
    });

  } catch (error) {
    console.error('ERROR CRÍTICO en ruta API:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Obtiene productos para contexto desde la base de datos o cache
 * @returns {Promise<Array>} - Array de productos
 */
async function getProductsForContext() {
  try {
    // Obtener productos desde la API de productos
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/product/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Usar cache de Next.js para evitar sobrecargar la API
      next: { revalidate: 300 } // Cache por 5 minutos
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo productos: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.products) {
      return data.products;
    }

    return [];
  } catch (error) {
    console.error('Error obteniendo productos para contexto:', error);
    return [];
  }
}

/**
 * Genera un resumen de productos para el contexto
 * @param {Array} products - Array de productos
 * @returns {string} - Resumen formateado
 */
function generateProductsSummary(products) {
  if (!products || products.length === 0) {
    return 'No hay productos disponibles en este momento.';
  }

  const categories = [...new Set(products.map(p => p.category))];
  const categoryNames = {
    'smartphone': 'Smartphones',
    'laptop': 'Laptops/Computadoras',
    'earphone': 'Audífonos/Earphones',
    'headphone': 'Headphones/Auriculares',
    'watch': 'Relojes Inteligentes',
    'camera': 'Cámaras',
    'accessories': 'Accesorios',
    'tablet': 'Tablets',
    'console': 'Consolas',
    'gaming': 'Juegos',
    'home': 'hogar',
  };

  const displayCategories = categories.map(cat => categoryNames[cat] || cat).join(', ');
  const priceRange = {
    min: Math.min(...products.map(p => p.offerPrice)),
    max: Math.max(...products.map(p => p.offerPrice))
  };

  let summary = `Tenemos ${products.length} productos disponibles en las siguientes categorías: ${displayCategories}.`;
  summary += ` Los precios varían desde Q${priceRange.min} hasta Q${priceRange.max}.`;

  // Agregar algunos productos destacados
  const featuredProducts = products.slice(0, 3);
  if (featuredProducts.length > 0) {
    summary += `\n\nAlgunos productos destacados:`;
    featuredProducts.forEach((product, index) => {
      const categoryName = categoryNames[product.category] || product.category;
      summary += `\n• ${product.name} (${categoryName}) - Q${product.offerPrice}`;
    });
  }

  return summary;
}
