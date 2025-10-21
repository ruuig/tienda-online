// Servicio de chat inteligente que integra OpenAI con el sistema de conversaciones
import { OpenAIClient } from './openaiClient.js';
import { conversationalCartService } from '@/src/services/conversationalCartService.js';

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
      console.log('ChatService: Clasificando intención...');
      // 1. Clasificar intención del mensaje
      const intent = await this.openaiClient.classifyIntent(userMessage);
      console.log('ChatService: Intención clasificada:', intent);

      // 2. Procesar intenciones de compra conversacional
      const purchaseResult = await this.processPurchaseIntent(conversationId, userMessage, intent, context);

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
            processingTime: Date.now() - startTime,
            model: 'gpt-4'
          },
          createdAt: new Date()
        };

        return {
          success: true,
          message: botMessageData,
          intent,
          sources: context.sources || [],
          processingTime: Date.now() - startTime
        };
      }

      // 3. Si no es compra, generar respuesta normal con OpenAI
      const systemMessage = this.getSystemMessage(context);
      const messages = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ];

      console.log('ChatService: Generando respuesta con OpenAI...');
      const response = await this.openaiClient.generateResponse(messages, {
        intent: intent.intent,
        confidence: intent.confidence
      });

      console.log('ChatService: Respuesta generada:', response.substring(0, 100));

      // 4. Crear mensaje de respuesta del bot
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
          usedProductContext: !!context.products,
          productsCount: context.products?.length || 0
        },
        createdAt: new Date()
      };

      console.log('ChatService: Mensaje creado exitosamente');
      return {
        success: true,
        message: botMessageData,
        intent,
        sources: context.sources || [],
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
          return await conversationalCartService.processUserResponse(conversationId, userMessage);

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
   * Genera el mensaje del sistema para OpenAI con contexto dinámico
   * @param {Object} context - Contexto adicional (productos, etc.)
   * @returns {string} - Mensaje del sistema
   */
  getSystemMessage(context = {}) {
    let systemMessage = `¡Hola! Soy tu asistente de compras virtual para esta increíble tienda de tecnología. 😊

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

    return systemMessage;
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
