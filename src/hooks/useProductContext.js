/**
 * Hook personalizado para contexto de productos en el chat
 */

import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { productContextService } from '@/src/services/productContextService';

export const useProductContext = () => {
  const { products } = useAppContext();
  const [isInitialized, setIsInitialized] = useState(false);
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Inicializar contexto cuando cambien los productos
  useEffect(() => {
    const initializeContext = async () => {
      if (products.length > 0) {
        setIsLoading(true);
        try {
          await productContextService.initialize(products);
          setIsInitialized(true);
          console.log('✅ Contexto de productos inicializado en el chat');
        } catch (error) {
          console.error('❌ Error inicializando contexto de productos:', error);
        }
        setIsLoading(false);
      }
    };

    initializeContext();
  }, [products]);

  // Generar contexto para una consulta específica
  const generateContext = async (query = '') => {
    try {
      const context = await productContextService.generateContext(query);
      setContext(context);
      return context;
    } catch (error) {
      console.error('❌ Error generando contexto:', error);
      return '';
    }
  };

  // Buscar productos relevantes
  const searchProducts = async (query, limit = 3) => {
    try {
      return await productContextService.searchProducts(query, limit);
    } catch (error) {
      console.error('❌ Error buscando productos:', error);
      return [];
    }
  };

  // Obtener resumen de productos
  const getProductsSummary = () => {
    return productContextService.getProductsSummary();
  };

  // Obtener estadísticas del servicio
  const getStats = () => {
    return productContextService.getStats();
  };

  return {
    isInitialized,
    isLoading,
    context,
    generateContext,
    searchProducts,
    getProductsSummary,
    getStats,
    products: products || []
  };
};
