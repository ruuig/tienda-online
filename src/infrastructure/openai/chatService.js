// Servicio de chat inteligente que integra OpenAI con el sistema de conversaciones
import { OpenAIClient } from './openaiClient.js';
import { conversationalCartService } from '@/src/services/conversationalCartService.js';
import { createPromptConfigService } from '@/src/services/promptConfigService.js';

const promptConfigService = createPromptConfigService();
const OFF_TOPIC_TEMPLATE = promptConfigService.getPrompt('offTopicResponse')?.content ||
  '¡Hola! 😊 Soy un asistente especializado únicamente en productos tecnológicos y compras en nuestra tienda online. ' +
  'Para preguntas sobre {TOPIC}, te recomiendo consultar fuentes especializadas. ¿Te puedo ayudar con smartphones, laptops, audífonos u otros productos electrónicos? 🛒';

export class ChatService {
  constructor(openaiApiKey) {
    this.openaiClient = new OpenAIClient(openaiApiKey);
  }

  /**
   * Procesa un mensaje del usuario y genera respuesta automática
   * @param {string} conversationId - ID de la conversación
   * @param {string} userMessage - Mensaje del usuario
   * @param {Object} context - Contexto adicional (incluyendo productos)
   * @returns {Promise<Object>} - Respuesta procesada
   */
  async processUserMessage(conversationId, userMessage, context = {}) {
    const startTime = Date.now();
    console.log('ChatService: Procesando mensaje:', { conversationId, userMessage: userMessage.substring(0, 100) });

    try {
      const { ragContext: incomingRagContext, ...baseContext } = context || {};
      const ragData = await this.prepareRagData(userMessage, incomingRagContext);
      const aiContext = {
        ...baseContext,
        ragSnippets: ragData.snippets,
        ragSources: ragData.sources
      };

      console.log('ChatService: Clasificando intención...');
      // 1. Clasificar intención del mensaje
      const intent = await this.openaiClient.classifyIntent(userMessage);
      console.log('ChatService: Intención clasificada:', intent);

      // 2. Procesar intenciones de compra conversacional
      const purchaseResult = await this.processPurchaseIntent(conversationId, userMessage, intent, aiContext);

      // Si hay una respuesta específica para compra, usarla
      if (purchaseResult) {
        console.log('ChatService: Respuesta de compra generada:', purchaseResult.action);

        const botMessageData = {
          conversationId,
          content: purchaseResult.message,
          sender: 'bot',
          type: 'purchase_flow',
          metadata: {
            intent: intent.intent,
            confidence: intent.confidence,
            purchaseAction: purchaseResult.action,
            cartState: purchaseResult.cartSummary,
            nextSteps: purchaseResult.nextSteps,
            products: purchaseResult.products || [], // Incluir productos si están disponibles
            processingTime: Date.now() - startTime,
            model: 'gpt-4',
            usedProductContext: !!aiContext.products,
            productsCount: aiContext.products?.length || 0,
            rag: {
              used: ragData.snippets.length > 0,
              snippets: ragData.snippets,
              sources: ragData.sources,
              vendorId: incomingRagContext?.vendorId || null
            }
          },
          createdAt: new Date()
        };

        return {
          success: true,
          message: botMessageData,
          intent,
          sources: ragData.sources,
          processingTime: Date.now() - startTime
        };
      }

      // 3. Si no es compra, preparar system message con el contexto enriquecido
      const aiSystemMessage = this.getSystemMessage(aiContext);

      // 3. Detectar consultas fuera de contexto de la tienda y responder con negativa alegre
      if (this.shouldRefuseRequest(intent, userMessage, aiContext)) {
        console.log('ChatService: Consulta fuera de contexto detectada, enviando negativa.');

        const refusalMessage = this.buildOffTopicMessage(userMessage);
        const botMessageData = {
          conversationId,
          content: refusalMessage,
          sender: 'bot',
          type: 'text',
          metadata: {
            intent: intent.intent,
            confidence: intent.confidence,
            refusal: true,
            processingTime: Date.now() - startTime,
            model: 'refusal-policy'
          },
          createdAt: new Date()
        };

        return {
          success: true,
          message: botMessageData,
          intent,
          sources: aiContext.ragSources || [],
          processingTime: Date.now() - startTime
        };
      }

      // 4. Generar respuesta normal con OpenAI reutilizando systemMessage
      const messages = [
        { role: 'system', content: aiSystemMessage },
        { role: 'user', content: userMessage }
      ];

      console.log('ChatService: Generando respuesta con OpenAI...');
      const response = await this.openaiClient.generateResponse(messages, {
        ...aiContext,
        intent: intent.intent,
        confidence: intent.confidence
      });

      console.log('ChatService: Respuesta generada:', response.substring(0, 100));

      // 5. Buscar productos relacionados si la consulta menciona productos
      let relevantProducts = [];
      if (intent.intent === 'consulta_producto' || userMessage.toLowerCase().includes('producto')) {
        try {
          relevantProducts = await conversationalCartService.searchProducts(userMessage, 3);
          console.log(`ChatService: Encontrados ${relevantProducts.length} productos relacionados`);
        } catch (error) {
          console.warn('ChatService: Error buscando productos relacionados:', error.message);
        }
      }

      // 6. Crear mensaje de respuesta del bot
      const botMessageData = {
        conversationId,
        content: response,
        sender: 'bot',
        type: 'text',
        metadata: {
          intent: intent.intent,
          confidence: intent.confidence,
          processingTime: Date.now() - startTime,
          model: 'gpt-4',
          usedProductContext: !!aiContext.products,
          productsCount: aiContext.products?.length || 0,
          products: relevantProducts, // Incluir productos relacionados
          rag: {
            used: ragData.snippets.length > 0,
            snippets: ragData.snippets,
            sources: ragData.sources,
            vendorId: incomingRagContext?.vendorId || null
          }
        },
        createdAt: new Date()
      };

      console.log('ChatService: Mensaje creado exitosamente');
      return {
        success: true,
        message: botMessageData,
        intent,
        sources: ragData.sources,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('ChatService: Error procesando mensaje:', error);
      console.error('ChatService: Error stack:', error.stack);

      // Crear mensaje de error del bot
      const errorMessageData = {
        conversationId,
        content: 'Lo siento, estoy teniendo problemas para procesar tu consulta. Un agente especializado te ayudará en unos momentos.',
        sender: 'bot',
        type: 'text',
        metadata: {
          error: true,
          originalError: error.message,
          processingTime: Date.now() - startTime
        },
        createdAt: new Date()
      };

      return {
        success: false,
        message: errorMessageData,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Procesa intenciones de compra y maneja el flujo conversacional
   * @param {string} conversationId - ID de la conversación
   * @param {string} userMessage - Mensaje del usuario
   * @param {Object} intent - Intención clasificada
   * @param {Object} context - Contexto adicional
   * @returns {Promise<Object|null>} - Resultado del flujo de compra o null
   */
  async processPurchaseIntent(conversationId, userMessage, intent, context) {
    const userId = context.userInfo?.id || 'demo-user';

    // Solo procesar intenciones de compra si hay productos disponibles
    if (!context.products || context.products.length === 0) {
      console.log('ChatService: No hay productos disponibles para procesar compra');
      return null;
    }

    // Categorías de compra que requieren procesamiento especial
    const purchaseIntents = [
      'compra_producto', 'agregar_carrito', 'ver_carrito',
      'modificar_carrito', 'proceder_pago', 'confirmar_compra'
    ];

    if (!purchaseIntents.includes(intent.intent)) {
      return null; // No es una intención de compra
    }

    console.log('ChatService: Procesando intención de compra:', intent.intent);

    try {
      switch (intent.intent) {
        case 'compra_producto':
        case 'consulta_producto':
          // Si menciona un producto específico, buscarlo y preguntar si quiere comprarlo
          const product = await conversationalCartService.findProductInMessage(userMessage);

          if (product) {
            console.log('ChatService: Producto encontrado:', product.name);
            return await conversationalCartService.processProductPurchaseIntent(
              conversationId,
              userId,
              userMessage,
              product
            );
          }
          break;

        case 'agregar_carrito':
          // Si quiere agregar al carrito, procesar la respuesta
          // Primero verificar si hay un estado de compra activo
          const cartState = conversationalCartService.getConversationState(conversationId);

          if (cartState && cartState.pendingProduct) {
            console.log('ChatService: Producto pendiente encontrado:', cartState.pendingProduct.name);
            return await conversationalCartService.processUserResponse(conversationId, userMessage);
          }

          // Si no hay producto pendiente, intentar encontrar el producto en el mensaje
          const productToAdd = await conversationalCartService.findProductInMessage(userMessage);
          if (productToAdd) {
            console.log('ChatService: Producto encontrado en mensaje:', productToAdd.name);
            return await conversationalCartService.processProductPurchaseIntent(
              conversationId,
              userId,
              userMessage,
              productToAdd
            );
          }

          // Si no se puede determinar el producto, pedir aclaración
          return {
            action: 'ask_which_product',
            message: '¡Por supuesto! Pero, necesito saber cuál producto te gustaría agregar a tu carrito. ¿Podrías indicarme el nombre del producto por favor? 😊',
            nextSteps: [
              'Ver productos disponibles',
              'Buscar por nombre',
              'Ver mi carrito actual'
            ]
          };

        case 'ver_carrito':
          // Mostrar contenido del carrito
          return conversationalCartService.showCart(conversationId);

        case 'proceder_pago':
          // Iniciar proceso de checkout
          return conversationalCartService.startCheckout(conversationId);

        case 'confirmar_compra':
          // Confirmar y procesar compra
          return conversationalCartService.confirmPurchase(conversationId);

        default:
          // Para otras intenciones, usar el estado actual de la conversación
          return await conversationalCartService.processUserResponse(conversationId, userMessage);
      }

      return null;

    } catch (error) {
      console.error('ChatService: Error procesando intención de compra:', error);
      return {
        action: 'error',
        message: 'Lo siento, hubo un problema procesando tu solicitud de compra. ¿Puedes intentarlo de nuevo?',
        nextSteps: [
          'Reintentar',
          'Ver productos disponibles',
          'Contactar con soporte'
        ]
      };
    }
  }

  /**
   * Determina si se debe rechazar la consulta por estar fuera del contexto de la tienda
   * @param {Object} intent - Intención clasificada
   * @param {string} userMessage - Mensaje del usuario
   * @param {Object} context - Contexto adicional
   * @returns {boolean}
   */
  shouldRefuseRequest(intent, userMessage, context) {
    if (!intent || intent.intent === 'otra') {
      return true;
    }

    const normalizedMessage = typeof userMessage === 'string' ? userMessage.toLowerCase() : '';
    const storeKeywords = [
      'producto', 'productos', 'tienda', 'comprar', 'compra', 'carrito', 'pago', 'precio',
      'envío', 'garantía', 'tecnología', 'smartphone', 'laptop', 'audífonos', 'pedido',
      'factura', 'oferta', 'electrónica', 'soporte'
    ];

    const looksStoreRelated = storeKeywords.some(keyword => normalizedMessage.includes(keyword));

    // Mejor cobertura del contexto relevante
    const hasRelevantContext =
      (Array.isArray(context?.sources) && context.sources.length > 0) ||
      (Array.isArray(context?.ragSources) && context.ragSources.length > 0) ||
      (Array.isArray(context?.products) && context.products.length > 0);

    return !looksStoreRelated && !hasRelevantContext && this.isGeneralConversationIntent(intent.intent);
  }

  /**
   * Determina si la intención corresponde a conversación general
   * @param {string} intentName - Nombre de la intención
   * @returns {boolean}
   */
  isGeneralConversationIntent(intentName) {
    const generalIntents = ['saludo', 'queja', 'consulta_general', 'otra'];
    return generalIntents.includes(intentName);
  }

  /**
   * Construye el mensaje de rechazo usando la plantilla oficial
   * @param {string} userMessage - Mensaje original del usuario
   * @returns {string}
   */
  buildOffTopicMessage(userMessage) {
    const sanitizedTopic = this.extractTopic(userMessage);
    return OFF_TOPIC_TEMPLATE.replace('{TOPIC}', sanitizedTopic);
  }

  /**
   * Extrae un tema corto del mensaje del usuario
   * @param {string} userMessage - Mensaje original del usuario
   * @returns {string}
   */
  extractTopic(userMessage) {
    if (!userMessage || typeof userMessage !== 'string') {
      return 'ese tema';
    }

    const cleaned = userMessage
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .trim();

    if (!cleaned) {
      return 'ese tema';
    }

    const firstSentence = cleaned.split(/[?.!]/)[0] || cleaned;
    const topic = firstSentence.replace(/[^\p{L}\p{N}\s]/gu, '').trim();

    if (!topic) {
      return 'ese tema';
    }

    return topic.length > 60 ? `${topic.slice(0, 57)}...` : topic;
  }

  /**
   * Genera el mensaje del sistema para OpenAI con contexto dinámico
   * @param {Object} context - Contexto adicional (productos, etc.)
   * @returns {string} - Mensaje del sistema
   */
  getSystemMessage(context = {}) {
    let systemMessage = `¡Hola! Soy tu asistente de compras virtual para esta increíble tienda de tecnología. 😊

RESTRICCIONES CRÍTICAS:
- Si la consulta es sobre temas NO relacionados con la tienda o la tecnología, recházala con amabilidad.
- Debes responder usando exactamente este mensaje (reemplaza {TOPIC} por el tema mencionado): "${OFF_TOPIC_TEMPLATE}"

ESTOY AQUÍ PARA AYUDARTE:
- Te ayudo a encontrar productos perfectos para ti
- Puedo agregar productos a tu carrito de forma fácil y rápida
- Te guío paso a paso en tu proceso de compra
- Respondo todas tus dudas sobre productos y precios

ESTILO DE RESPUESTA:
- Soy alegre, entusiasta y súper amigable
- Uso emojis para hacer la conversación más divertida 🎉
- Mantengo las respuestas cortas y fáciles de entender
- Siempre ofrezco opciones claras y siguientes pasos

CAPACIDADES ESPECIALES:
- Conozco todos los productos disponibles en tiempo real
- Puedo buscar productos por nombre, marca o características
- Te ayudo a comparar opciones y tomar decisiones
- Manejo tu carrito de compras de manera conversacional
- Te llevo directo al checkout cuando estés listo

INSTRUCCIONES DE COMPRA:
- Cuando menciones un producto específico, siempre pregunto si quieres agregarlo al carrito
- Si confirmas, lo agrego inmediatamente y muestro el estado del carrito
- Siempre ofrezco opciones como "ver carrito", "agregar más" o "proceder al pago"
- Uso botones interactivos para hacer las respuestas más visuales

CONTEXTO DE LA TIENDA:
- Somos especialistas en tecnología y productos electrónicos
- Ofrecemos garantía en todos nuestros productos
- Envío gratuito en compras mayores a Q500
- Políticas de devolución: 30 días para productos sin usar

¡Estoy emocionado de ayudarte con tus compras! ¿Qué te gustaría encontrar hoy? 🛒✨`;

    // Agregar contexto de productos si está disponible
    if (context.products && context.products.length > 0) {
      const summary = context.productsSummary || this.generateProductsSummary(context.products);

      systemMessage += `

📦 PRODUCTOS DISPONIBLES:
${summary}

🎯 CUANDO UN CLIENTE PREGUNTA POR PRODUCTOS:
- Menciona el nombre exacto del producto
- Incluye el precio en Quetzales (Q)
- Describe brevemente las características principales
- PREGUNTA SI QUIERE AGREGARLO AL CARRITO
- Ofrece opciones como "ver más detalles" o "buscar alternativas"

🛒 CUANDO PROCESAS UNA COMPRA:
- Sé entusiasta y confirma cada acción
- Muestra el estado actual del carrito
- Pregunta qué quiere hacer después
- Ofrece opciones claras como botones

¡Recuerda ser siempre positivo y útil! 😄`;
    }

    if (context.ragSnippets && context.ragSnippets.length > 0) {
      const formattedSnippets = context.ragSnippets.map(snippet => {
        const sourceLabel = snippet.source ? ` (Fuente: ${snippet.source})` : '';
        return `[#${snippet.index}] ${snippet.title}${sourceLabel}\n${snippet.excerpt}`;
      }).join('\n\n');

      systemMessage += `

📚 DOCUMENTOS DE REFERENCIA DISPONIBLES:
${formattedSnippets}

🔖 INSTRUCCIONES PARA USAR LAS FUENTES:
- Utiliza la información de los documentos solo si es relevante para la pregunta del cliente.
- Cuando cites información de un documento, menciona el identificador correspondiente con el formato [#n].
- Si la respuesta no está en los documentos, indícalo y ofrece escalar a un agente humano.`;
    }

    return systemMessage;
  }

  /**
   * Prepara datos de soporte RAG para enriquecer la respuesta
   * @param {string} userMessage - Mensaje del usuario
   * @param {Object} ragContext - Contexto RAG recibido desde la ruta
   * @returns {Promise<{matches: Array, snippets: Array, sources: Array}>}
   */
  async prepareRagData(userMessage, ragContext = {}) {
    if (!ragContext) {
      return { matches: [], snippets: [], sources: [] };
    }

    let matches = Array.isArray(ragContext.matches) ? [...ragContext.matches] : [];
    const limit = ragContext.limit || 5;

    const hasSearchService = ragContext.service && typeof ragContext.service.search === 'function';

    if ((matches.length === 0) && hasSearchService) {
      try {
        if (ragContext.documents?.length && ragContext.service.vectorStore && ragContext.service.vectorStore.size === 0) {
          await ragContext.service.buildIndex(ragContext.documents);
        }
        matches = await ragContext.service.search(userMessage, limit);
      } catch (error) {
        console.warn('ChatService: Error ejecutando búsqueda RAG de respaldo:', error.message);
      }
    }

    const snippets = this.formatRagSnippets(matches, {
      limit,
      vendorId: ragContext.vendorId,
      fallbackDocuments: ragContext.documents || [],
      query: userMessage
    });

    const sources = this.extractRagSources(snippets);

    return { matches, snippets, sources };
  }

  /**
   * Convierte resultados RAG en fragmentos legibles
   * @param {Array} matches - Resultados devueltos por el RAG
   * @param {Object} options - Opciones de formato
   * @returns {Array}
   */
  formatRagSnippets(matches, options = {}) {
    const {
      limit = 5,
      vendorId = null,
      fallbackDocuments = [],
      query = ''
    } = options;

    let workingMatches = Array.isArray(matches) ? matches.filter(Boolean) : [];

    if (workingMatches.length === 0 && fallbackDocuments.length > 0) {
      const normalizedQuery = (query || '').toLowerCase();
      const fallbackMatches = fallbackDocuments
        .map(doc => {
          const content = doc.content || '';
          if (!content || !normalizedQuery) return null;
          const index = content.toLowerCase().indexOf(normalizedQuery);
          if (index === -1) return null;

          const start = Math.max(0, index - 200);
          const end = Math.min(content.length, index + normalizedQuery.length + 200);
          const excerpt = content.substring(start, end);

          return {
            _id: doc._id || doc.id,
            title: doc.title,
            type: doc.type,
            category: doc.category,
            metadata: doc.metadata || {},
            vendorId: doc.vendorId || vendorId,
            relevanceScore: 0.15,
            chunks: [
              {
                content: excerpt,
                similarity: 0.15,
                metadata: { startIndex: start, endIndex: end }
              }
            ]
          };
        })
        .filter(Boolean);

      workingMatches = fallbackMatches;
    }

    const snippets = [];

    workingMatches.forEach((doc, docIndex) => {
      const docChunks = Array.isArray(doc.chunks) && doc.chunks.length > 0
        ? doc.chunks
        : [{
          content: doc.content,
          similarity: doc.relevanceScore,
          metadata: doc.metadata
        }];

      docChunks.forEach((chunk, chunkIndex) => {
        const excerpt = this.truncateText(chunk?.content || '', 420);
        if (!excerpt) {
          return;
        }

        const similarity = typeof chunk.similarity === 'number'
          ? chunk.similarity
          : typeof doc.relevanceScore === 'number'
            ? doc.relevanceScore
            : 0;

        snippets.push({
          documentId: doc._id || doc.id || null,
          title: doc.title || doc.metadata?.title || `Documento ${docIndex + 1}`,
          excerpt,
          similarity,
          source: doc.metadata?.source || doc.source || doc.fileName || null,
          metadata: {
            type: doc.type || doc.metadata?.type || null,
            category: doc.category || doc.metadata?.category || null,
            vendorId: doc.vendorId || vendorId,
            chunkRange: {
              start: chunk.metadata?.startIndex ?? null,
              end: chunk.metadata?.endIndex ?? null
            },
            fileName: doc.fileName || null
          }
        });
      });
    });

    const ordered = snippets
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit)
      .map((snippet, index) => ({ ...snippet, index: index + 1 }));

    return ordered;
  }

  /**
   * Extrae información resumida de las fuentes RAG
   * @param {Array} snippets - Fragmentos utilizados en la respuesta
   * @returns {Array}
   */
  extractRagSources(snippets = []) {
    if (!Array.isArray(snippets) || snippets.length === 0) {
      return [];
    }

    const sourcesMap = new Map();

    snippets.forEach(snippet => {
      const key = snippet.documentId || `${snippet.title}-${snippet.source}`;

      if (!sourcesMap.has(key)) {
        sourcesMap.set(key, {
          documentId: snippet.documentId,
          title: snippet.title,
          source: snippet.source,
          similarity: snippet.similarity,
          metadata: {
            ...snippet.metadata,
            snippetIndexes: [snippet.index]
          }
        });
      } else {
        const existing = sourcesMap.get(key);
        existing.similarity = Math.max(existing.similarity || 0, snippet.similarity || 0);
        if (existing.metadata?.snippetIndexes && !existing.metadata.snippetIndexes.includes(snippet.index)) {
          existing.metadata.snippetIndexes.push(snippet.index);
        }
      }
    });

    return Array.from(sourcesMap.values()).map((source, index) => ({
      ...source,
      index: index + 1
    }));
  }

  /**
   * Recorta texto largo para mensajes de sistema
   * @param {string} text - Texto original
   * @param {number} length - Longitud máxima
   * @returns {string}
   */
  truncateText(text, length = 420) {
    if (!text) return '';
    const trimmed = String(text).trim();
    if (trimmed.length <= length) {
      return trimmed;
    }
    return `${trimmed.substring(0, length).trim()}…`;
  }

  /**
   * Genera un resumen de productos para el contexto
   * @param {Array} products - Array de productos
   * @returns {string} - Resumen formateado
   */
  generateProductsSummary(products) {
    const categories = [...new Set(products.map(p => p.category))];
    const categoryNames = {
      'smartphone': 'Smartphones',
      'laptop': 'Laptops/Computadoras',
      'earphone': 'Audífonos/Earphones',
      'headphone': 'Headphones/Auriculares',
      'watch': 'Relojes Inteligentes',
      'camera': 'Cámaras',
      'accessories': 'Accesorios'
    };

    const displayCategories = categories.map(cat => categoryNames[cat] || cat).join(', ');
    const priceRange = products.length > 0 ? {
      min: Math.min(...products.map(p => p.offerPrice)),
      max: Math.max(...products.map(p => p.offerPrice))
    } : null;

    let summary = `Tenemos ${products.length} productos disponibles en las siguientes categorías: ${displayCategories}.`;

    if (priceRange) {
      summary += ` Los precios varían desde Q${priceRange.min} hasta Q${priceRange.max}.`;
    }

    // Agregar algunos productos destacados
    const featuredProducts = products.slice(0, 5);
    if (featuredProducts.length > 0) {
      summary += `\n\nPRODUCTOS DESTACADOS:`;
      featuredProducts.forEach((product, index) => {
        const categoryName = categoryNames[product.category] || product.category;
        summary += `\n${index + 1}. ${product.name} (${categoryName}) - Q${product.offerPrice}`;
        if (product.description.length <= 100) {
          summary += ` - ${product.description}`;
        }
      });
    }

    return summary;
  }

  /**
   * Obtiene estadísticas del servicio de chat
   * @returns {Promise<Object>} - Estadísticas de uso
   */
  async getStats() {
    return {
      totalConversations: 0,
      activeConversations: 0,
      totalMessages: 0,
      averageMessagesPerConversation: 0
    };
  }
}

// Factory function para crear servicio de chat
export const createChatService = (openaiApiKey) => {
  return new ChatService(openaiApiKey);
};
