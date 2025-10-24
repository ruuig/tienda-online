/**
 * Hook para el carrito conversacional en el chat
 */

import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { conversationalCartService } from '@/src/services/conversationalCartService';

export const useConversationalCart = () => {
  const { user, addToCart, updateCartQuantity, getCartCount, getCartAmount } = useAppContext();
  const [cartState, setCartState] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Agregar producto al carrito real del contexto
  const addToRealCart = async (productId, quantity = 1) => {
    try {
      await addToCart(productId);
      return { success: true, message: 'Producto agregado al carrito' };
    } catch (error) {
      console.error('Error agregando al carrito real:', error);
      return { success: false, message: 'Error al agregar producto al carrito' };
    }
  };

  // Proceder al checkout real
  const proceedToCheckout = () => {
    // Redirigir a la página de carrito/pago
    if (typeof window !== 'undefined') {
      window.location.href = '/cart';
    }
  };

  // Iniciar flujo de compra
  const startPurchaseFlow = (conversationId) => {
    if (user) {
      const state = conversationalCartService.startPurchaseFlow(conversationId, user.id);
      setCartState(state);
      return state;
    }
    return null;
  };

  // Procesar respuesta del usuario
  const processUserResponse = async (conversationId, userResponse) => {
    setIsProcessing(true);
    try {
      const result = await conversationalCartService.processUserResponse(conversationId, userResponse);

      // Si se necesita agregar al carrito real, hacerlo
      if (result.action === 'update_quantity' || result.action === 'ask_add_to_cart') {
        // No agregar automáticamente, esperar confirmación
      }

      // Si se confirma agregar al carrito, hacerlo
      if (result.action === 'product_added' && result.success && user) {
        await addToRealCart(result.product._id || result.productId);
      }

      // Si se procede al pago, redirigir
      if (result.action === 'ready_for_checkout' || result.action === 'purchase_completed') {
        // La redirección se maneja en el componente
      }

      setCartState(conversationalCartService.getConversationState(conversationId));
      return result;

    } catch (error) {
      console.error('Error procesando respuesta:', error);
      return {
        action: 'error',
        message: 'Error procesando tu solicitud. ¿Puedes intentarlo de nuevo?'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancelar flujo de compra
  const cancelPurchase = (conversationId) => {
    conversationalCartService.cancelPurchase(conversationId);
    setCartState(null);
  };

  // Obtener estado del carrito
  const getCartState = (conversationId) => {
    return conversationalCartService.getConversationState(conversationId);
  };

  // Buscar productos relevantes
  const searchProducts = async (query, limit = 3) => {
    try {
      return await conversationalCartService.searchProducts(query, limit);
    } catch (error) {
      console.error('❌ Error buscando productos:', error);
      return [];
    }
  };

  return {
    cartState,
    isProcessing,
    startPurchaseFlow,
    processUserResponse,
    getCartState,
    cancelPurchase,
    proceedToCheckout,
    addToRealCart,
    searchProducts,
    realCartCount: getCartCount(),
    realCartAmount: getCartAmount()
  };
};
