import { productContextService } from '@/src/services/productContextService.js';

export class ConversationalCartService {
  constructor() {
    this.conversationState = new Map(); // Estado de compra por conversación
    this.cartActions = new Map(); // Acciones pendientes por conversación
  }

  /**
   * Inicia un estado de compra conversacional para una conversación
   * @param {string} conversationId - ID de la conversación
   * @param {string} userId - ID del usuario
   */
  startPurchaseFlow(conversationId, userId) {
    const state = {
      conversationId,
      userId,
      items: [], // Productos seleccionados para compra
      currentStep: 'product_selection',
      pendingProduct: null,
      pendingQuantity: 1,
      awaitingConfirmation: false,
      addresses: [],
      selectedAddress: null
    };

    this.conversationState.set(conversationId, state);
    console.log(`🛒 Iniciado flujo de compra para conversación ${conversationId}`);

    return state;
  }

  /**
   * Obtiene el estado actual de compra para una conversación
   * @param {string} conversationId - ID de la conversación
   * @returns {Object|null} - Estado de compra o null si no existe
   */
  getConversationState(conversationId) {
    return this.conversationState.get(conversationId) || null;
  }

  /**
   * Busca un producto específico mencionado en el mensaje
   * @param {string} message - Mensaje del usuario
   * @returns {Promise<Object|null>} - Producto encontrado o null
   */
  async findProductInMessage(message) {
    try {
      // Buscar productos relevantes usando el método público
      const relevantProducts = await this.searchProducts(message, 5);

      if (relevantProducts.length > 0) {
        // Si hay múltiples productos, tomar el más relevante (mayor score)
        // Si hay uno solo, tomarlo directamente
        return relevantProducts[0];
      }

      return null;
    } catch (error) {
      console.error('Error buscando producto en mensaje:', error);
      return null;
    }
  }

  /**
   * Busca productos relevantes para una consulta (método público)
   * @param {string} query - Consulta del usuario
   * @param {number} limit - Número máximo de resultados
   * @returns {Promise<Array>} - Productos relevantes
   */
  async searchProducts(query, limit = 5) {
    try {
      // Usar productContextService que ya tiene la lógica de búsqueda implementada
      return await productContextService.searchProducts(query, limit);

    } catch (error) {
      console.error('❌ Error buscando productos:', error);
      return [];
    }
  }

  /**
   * Inicializa el servicio con productos
   * @param {Array} products - Array de productos
   */
  async initialize(products) {
    try {
      console.log('🚀 Inicializando servicio de carrito conversacional...');

      // El productContextService ya maneja la inicialización del RAG
      // Solo necesitamos almacenar los productos para referencia
      this.productsCache = products;
      this.lastUpdate = new Date();

      console.log(`✅ Servicio de carrito inicializado con ${products.length} productos`);

    } catch (error) {
      console.error('❌ Error inicializando carrito conversacional:', error);
      throw error;
    }
  }

  /**
   * Procesa una intención de compra de producto
   * @param {string} conversationId - ID de la conversación
   * @param {string} userId - ID del usuario
   * @param {string} message - Mensaje del usuario
   * @param {Object} product - Producto encontrado
   * @returns {Promise<Object>} - Respuesta y acciones a tomar
   */
  async processProductPurchaseIntent(conversationId, userId, message, product) {
    let state = this.getConversationState(conversationId);

    if (!state) {
      state = this.startPurchaseFlow(conversationId, userId);
    }

    // Si el producto ya está en el carrito, actualizar cantidad
    const existingItem = state.items.find(item => item.productId === product._id);

    if (existingItem) {
      return {
        action: 'update_quantity',
        message: `¡Genial! El ${product.name} ya está en tu carrito con cantidad ${existingItem.quantity}. 🎉\n\n¿Quieres aumentar la cantidad o proceder al pago?`,
        product: product,
        currentQuantity: existingItem.quantity,
        products: [product], // Incluir el producto para mostrar la card
        nextSteps: [
          'Aumentar cantidad',
          'Ver carrito completo',
          'Proceder al pago',
          'Seguir comprando'
        ]
      };
    }

    // Si es un producto nuevo, preguntar si quiere agregarlo
    state.pendingProduct = product;
    state.currentStep = 'awaiting_add_confirmation';

    return {
      action: 'ask_add_to_cart',
      message: `¡Perfecto! Encontré el ${product.name} (${product.category}) por solo Q${product.offerPrice}. 😍\n\n¿Te gustaría agregarlo a tu carrito de compras?`,
      product: product,
      products: [product], // Incluir el producto para mostrar la card
      nextSteps: [
        'Sí, agregarlo al carrito',
        'No, gracias',
        'Ver más detalles',
        'Buscar otro producto'
      ]
    };
  }

  /**
   * Agrega un producto al carrito conversacional
   * @param {string} conversationId - ID de la conversación
   * @param {string} productId - ID del producto
   * @param {number} quantity - Cantidad a agregar
   * @returns {Object} - Estado actualizado
   */
  addProductToCart(conversationId, productId, quantity = 1) {
    const state = this.getConversationState(conversationId);

    if (!state) {
      throw new Error('No hay un flujo de compra activo para esta conversación');
    }

    const product = state.items.find(item => item.productId === productId);

    if (product) {
      product.quantity += quantity;
    } else {
      state.items.push({
        productId,
        quantity,
        addedAt: new Date()
      });
    }

    state.currentStep = 'product_added';
    state.awaitingConfirmation = false;
    state.pendingProduct = null;

    console.log(`✅ Agregado producto ${productId} al carrito conversacional. Total items: ${state.items.length}`);

    return {
      success: true,
      message: `¡Agregado al carrito! 🎉\n\nAhora tienes ${state.items.length} ${state.items.length === 1 ? 'producto' : 'productos'} en tu carrito.\n\n¿Quieres ver tu carrito o seguir comprando?`,
      cartSummary: this.getCartSummary(state)
    };
  }

  /**
   * Obtiene un resumen del carrito actual
   * @param {Object} state - Estado de la conversación
   * @returns {Object} - Resumen del carrito
   */
  getCartSummary(state) {
    const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = state.items.reduce((sum, item) => {
      // En un escenario real, obtendríamos el precio del producto
      // Por ahora usamos un precio estimado
      return sum + (item.price || 100) * item.quantity;
    }, 0);

    return {
      totalItems,
      totalAmount,
      items: state.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price || 0
      }))
    };
  }

  /**
   * Procesa la respuesta del usuario a las preguntas del flujo de compra
   * @param {string} conversationId - ID de la conversación
   * @param {string} userResponse - Respuesta del usuario
   * @returns {Promise<Object>} - Siguiente acción y mensaje
   */
  async processUserResponse(conversationId, userResponse) {
    const state = this.getConversationState(conversationId);

    if (!state) {
      return {
        action: 'no_purchase_flow',
        message: 'No hay un proceso de compra activo. ¿En qué puedo ayudarte?'
      };
    }

    const lowerResponse = userResponse.toLowerCase();

    // Procesar según el paso actual
    switch (state.currentStep) {
      case 'awaiting_add_confirmation':
        if (this.isAffirmativeResponse(lowerResponse) || lowerResponse.includes('sí') || lowerResponse.includes('agregar')) {
          return this.addProductToCart(conversationId, state.pendingProduct._id);
        } else if (this.isNegativeResponse(lowerResponse) || lowerResponse.includes('no') || lowerResponse.includes('cancelar')) {
          state.currentStep = 'product_selection';
          state.pendingProduct = null;
          return {
            action: 'cancelled',
            message: 'Entendido, no agregué el producto al carrito. 😊 ¿Hay algo más en lo que pueda ayudarte?',
            nextSteps: [
              'Buscar otros productos',
              'Ver productos disponibles',
              'Información general',
              'Ver mi carrito actual'
            ]
          };
        } else {
          return {
            action: 'ask_again',
            message: 'No entendí tu respuesta. 😅 ¿Quieres agregar este producto al carrito? (Sí/No)',
            product: state.pendingProduct,
            nextSteps: [
              'Sí, agregarlo al carrito',
              'No, gracias'
            ]
          };
        }

      case 'product_added':
        if (lowerResponse.includes('ver carrito') || lowerResponse.includes('qué tengo')) {
          return this.showCart(conversationId);
        } else if (lowerResponse.includes('proceder') || lowerResponse.includes('pagar') || lowerResponse.includes('checkout')) {
          return this.startCheckout(conversationId);
        } else if (lowerResponse.includes('agregar') || lowerResponse.includes('comprar')) {
          state.currentStep = 'product_selection';
          return {
            action: 'continue_shopping',
            message: '¡Perfecto! 🎉 ¿Qué otro producto te gustaría agregar al carrito?',
            nextSteps: [
              'Buscar productos específicos',
              'Ver categorías disponibles',
              'Ver carrito actual',
              'Proceder al pago'
            ]
          };
        }

      case 'checkout_ready':
        if (this.isAffirmativeResponse(lowerResponse) || lowerResponse.includes('sí') || lowerResponse.includes('confirmar')) {
          return this.confirmPurchase(conversationId);
        } else if (this.isNegativeResponse(lowerResponse) || lowerResponse.includes('no') || lowerResponse.includes('cancelar')) {
          state.currentStep = 'product_selection';
          return {
            action: 'cancelled_checkout',
            message: 'Entendido, el proceso de compra se ha cancelado. ¿Hay algo más en lo que pueda ayudarte?',
            nextSteps: [
              'Continuar comprando',
              'Modificar carrito',
              'Ver productos',
              'Ver mi carrito'
            ]
          };
        }

      default:
        return {
          action: 'unknown_step',
          message: '¿En qué puedo ayudarte con tu compra?'
        };
    }
  }

  /**
   * Muestra el contenido del carrito
   * @param {string} conversationId - ID de la conversación
   * @returns {Object} - Información del carrito
   */
  showCart(conversationId) {
    const state = this.getConversationState(conversationId);

    if (!state || state.items.length === 0) {
      return {
        action: 'empty_cart',
        message: `¡Tu carrito está vacío! 🛒✨\n\n¿Te ayudo a encontrar algunos productos increíbles para agregar? Tengo opciones geniales disponibles.`,
        nextSteps: [
          'Ver productos populares',
          'Buscar por categoría',
          'Ver ofertas especiales',
          'Explorar todo el catálogo'
        ]
      };
    }

    const summary = this.getCartSummary(state);
    let cartDetails = '🛒 **¡Mira tu carrito de compras!** 🎉\n\n';

    state.items.forEach((item, index) => {
      cartDetails += `${index + 1}. Producto ID: ${item.productId} (Cantidad: ${item.quantity})\n`;
    });

    cartDetails += `\n📊 **Resumen de tu compra:**\n`;
    cartDetails += `• ${summary.totalItems} productos en total\n`;
    cartDetails += `• Total estimado: Q${summary.totalAmount}\n\n`;

    return {
      action: 'show_cart',
      message: cartDetails + '¿Qué te gustaría hacer ahora? 😊',
      cartSummary: summary,
      nextSteps: [
        'Proceder al pago',
        'Modificar cantidades',
        'Agregar más productos',
        'Vaciar carrito'
      ]
    };
  }

  /**
   * Inicia el proceso de checkout
   * @param {string} conversationId - ID de la conversación
   * @returns {Object} - Información para checkout
   */
  startCheckout(conversationId) {
    const state = this.getConversationState(conversationId);

    if (!state || state.items.length === 0) {
      return {
        action: 'empty_cart',
        message: 'Tu carrito está vacío. Agrega algunos productos primero.'
      };
    }

    state.currentStep = 'checkout_ready';

    const summary = this.getCartSummary(state);
    const cartItemsArray = state.items.map(item => ({
      product: item.productId,
      quantity: item.quantity
    }));

    return {
      action: 'ready_for_checkout',
      message: `¡Perfecto! Estás a punto de completar tu compra. 🎊\n\n**Resumen de tu compra:**\n• ${summary.totalItems} productos\n• Total: Q${summary.totalAmount}\n\n¿Confirmas que quieres proceder con la compra?`,
      cartItems: cartItemsArray,
      cartSummary: summary,
      nextSteps: [
        'Sí, confirmar compra',
        'No, cancelar',
        'Ver detalles del carrito',
        'Modificar carrito'
      ]
    };
  }

  /**
   * Confirma y procesa la compra
   * @param {string} conversationId - ID de la conversación
   * @returns {Object} - Resultado de la compra
   */
  confirmPurchase(conversationId) {
    const state = this.getConversationState(conversationId);

    if (!state || state.items.length === 0) {
      return {
        action: 'error',
        message: 'No hay productos en el carrito para procesar.'
      };
    }

    // Aquí se integraría con el sistema real de órdenes
    // Por ahora, simulamos la creación de la orden
    const orderData = {
      conversationId,
      items: state.items,
      totalAmount: this.getCartSummary(state).totalAmount,
      createdAt: new Date()
    };

    // Limpiar el estado de compra
    this.conversationState.delete(conversationId);

    console.log('🛍️ Orden creada desde chat:', orderData);

    return {
      action: 'purchase_completed',
      message: `¡Excelente! Tu orden ha sido procesada exitosamente.\n\n**Detalles de la orden:**\n• ${orderData.items.length} productos\n• Total: Q${orderData.totalAmount}\n• Fecha: ${orderData.createdAt.toLocaleDateString()}\n\nTe redirigiré a la página de carrito para que puedas completar el pago. ¿Te parece bien?`,
      orderData,
      redirectTo: '/cart',
      nextSteps: [
        'Ir al carrito para pagar',
        'Continuar comprando',
        'Ver mis órdenes'
      ]
    };
  }

  /**
   * Cancela el flujo de compra
   * @param {string} conversationId - ID de la conversación
   */
  cancelPurchase(conversationId) {
    this.conversationState.delete(conversationId);
    console.log(`❌ Flujo de compra cancelado para conversación ${conversationId}`);
  }

  /**
   * Verifica si la respuesta del usuario es afirmativa
   * @param {string} response - Respuesta del usuario
   * @returns {boolean} - True si es afirmativa
   */
  isAffirmativeResponse(response) {
    const affirmativeWords = [
      'sí', 'si', 'yes', 'claro', 'por supuesto', 'ok', 'okay',
      'perfecto', 'excelente', 'de acuerdo', 'confirmo', 'confirmar'
    ];
    return affirmativeWords.some(word => response.includes(word));
  }

  /**
   * Verifica si la respuesta del usuario es negativa
   * @param {string} response - Respuesta del usuario
   * @returns {boolean} - True si es negativa
   */
  isNegativeResponse(response) {
    const negativeWords = [
      'no', 'cancelar', 'nunca', 'jamás', 'mejor no', 'quizás no',
      'no gracias', 'no quiero', 'cancel'
    ];
    return negativeWords.some(word => response.includes(word));
  }

  /**
   * Obtiene estadísticas del servicio de carrito conversacional
   * @returns {Object} - Estadísticas de uso
   */
  getStats() {
    return {
      activeConversations: this.conversationState.size,
      totalConversations: this.conversationState.size,
      activePurchaseFlows: Array.from(this.conversationState.values()).filter(state =>
        state.items.length > 0
      ).length
    };
  }
}

// Instancia global del servicio
export const conversationalCartService = new ConversationalCartService();
