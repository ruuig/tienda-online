/**
 * Servicio de contexto de productos para el chat
 * Convierte productos en documentos RAG y proporciona funciones de búsqueda
 */

import { RAGService } from '@/src/infrastructure/rag/ragService.js';

export class ProductContextService {
  constructor() {
    this.ragService = null;
    this.productsCache = [];
    this.lastUpdate = null;
  }

  /**
   * Inicializa el servicio con productos
   * @param {Array} products - Array de productos
   */
  async initialize(products) {
    try {
      console.log('🚀 Inicializando servicio de contexto de productos...');

      // Crear repositorio mock para RAG
      const documentRepository = {
        findAll: async (filters) => {
          return this.productsToDocuments(products);
        }
      };

      // Crear servicio RAG
      this.ragService = new RAGService(documentRepository);

      // Convertir productos a documentos y construir índice
      const documents = this.productsToDocuments(products);
      await this.ragService.buildIndex(documents);

      this.productsCache = products;
      this.lastUpdate = new Date();

      console.log(`✅ Contexto de productos inicializado con ${products.length} productos`);

    } catch (error) {
      console.error('❌ Error inicializando contexto de productos:', error);
      throw error;
    }
  }

  /**
   * Convierte productos en documentos para RAG
   * @param {Array} products - Array de productos
   * @returns {Array} - Array de documentos
   */
  productsToDocuments(products) {
    return products.map(product => ({
      _id: `product_${product._id}`,
      title: product.name,
      content: this.generateProductContent(product),
      type: 'product',
      category: 'products',
      tags: [
        product.category,
        product.name,
        ...product.description.toLowerCase().split(' ').filter(word => word.length > 3)
      ],
      metadata: {
        productId: product._id,
        category: product.category,
        price: product.offerPrice,
        originalPrice: product.price,
        images: product.image
      }
    }));
  }

  /**
   * Genera contenido detallado de un producto para el RAG
   * @param {Object} product - Producto
   * @returns {string} - Contenido formateado
   */
  generateProductContent(product) {
    const features = this.extractFeatures(product.description);
    const categoryInfo = this.getCategoryInfo(product.category);

    return `
PRODUCTO: ${product.name}

CATEGORÍA: ${categoryInfo.displayName}
PRECIO: Q${product.offerPrice}
${product.price > product.offerPrice ? `PRECIO ORIGINAL: Q${product.price}` : ''}

DESCRIPCIÓN:
${product.description}

CARACTERÍSTICAS PRINCIPALES:
${features.map(f => `• ${f}`).join('\n')}

INFORMACIÓN ADICIONAL:
- Categoría técnica: ${product.category}
- ID del producto: ${product._id}
- Fecha de creación: ${new Date(product.date).toLocaleDateString()}
${categoryInfo.description ? `- ${categoryInfo.description}` : ''}

¿CÓMO COMPRAR?
1. Agregar al carrito desde la página del producto
2. Proceder al checkout
3. Elegir método de pago
4. Confirmar la compra

POLÍTICAS:
- Envío disponible a toda Guatemala
- Devoluciones dentro de 30 días
- Garantía según el fabricante
    `.trim();
  }

  /**
   * Extrae características del texto de descripción
   * @param {string} description - Descripción del producto
   * @returns {Array} - Array de características
   */
  extractFeatures(description) {
    // Buscar patrones comunes de características
    const features = [];
    const lowerDesc = description.toLowerCase();

    // Características comunes de productos electrónicos
    const featurePatterns = [
      { pattern: /(\d+)\s*gb|(\d+)\s*gb\s*ram|(\d+)\s*gb\s*almacenamiento/i, extract: (match) => `${match[1] || match[2] || match[3]}GB de almacenamiento` },
      { pattern: /(\d+)\s*mp|(\d+)\s*megapixeles|c[áa]mara\s*(\d+)\s*mp/i, extract: (match) => `Cámara de ${match[1] || match[2] || match[3]} megapíxeles` },
      { pattern: /bluetooth|wifi|inal[áa]mbrico|conectividad/i, extract: (match) => 'Conectividad inalámbrica' },
      { pattern: /bater[íi]a|duraci[óo]n/i, extract: (match) => 'Batería de larga duración' },
      { pattern: /pantalla|t[áa]ctil|display/i, extract: (match) => 'Pantalla táctil' },
      { pattern: /r[áa]pido|carga\s*r[áa]pida|fast\s*charge/i, extract: (match) => 'Carga rápida' },
      { pattern: /resistente|agua|sumergible|ip\d+/i, extract: (match) => match[4] ? `Resistente al agua (IP${match[4]})` : 'Resistente al agua' }
    ];

    featurePatterns.forEach(({ pattern, extract }) => {
      const match = lowerDesc.match(pattern);
      if (match) {
        features.push(extract(match));
      }
    });

    // Si no se encontraron características específicas, extraer oraciones
    if (features.length === 0) {
      const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 20);
      features.push(...sentences.slice(0, 3).map(s => s.trim()));
    }

    return features.slice(0, 5); // Limitar a 5 características
  }

  /**
   * Obtiene información adicional de categorías
   * @param {string} category - Categoría del producto
   * @returns {Object} - Información de la categoría
   */
  getCategoryInfo(category) {
    const categories = {
      'smartphone': {
        displayName: 'Smartphone',
        description: 'Teléfono inteligente con funciones avanzadas'
      },
      'laptop': {
        displayName: 'Laptop/Computadora Portátil',
        description: 'Computadora portátil para trabajo y entretenimiento'
      },
      'earphone': {
        displayName: 'Audífonos/Earphones',
        description: 'Audífonos para música y llamadas'
      },
      'headphone': {
        displayName: 'Headphones/Auriculares',
        description: 'Auriculares de diadema para audio de alta calidad'
      },
      'watch': {
        displayName: 'Reloj Inteligente/Smartwatch',
        description: 'Reloj con funciones inteligentes y conectividad'
      },
      'camera': {
        displayName: 'Cámara',
        description: 'Cámara fotográfica o de video'
      },
      'accessories': {
        displayName: 'Accesorios',
        description: 'Accesorios y complementos para productos tecnológicos'
      }
    };

    return categories[category] || {
      displayName: category.charAt(0).toUpperCase() + category.slice(1),
      description: ''
    };
  }

  /**
   * Busca productos relevantes para una consulta
   * @param {string} query - Consulta del usuario
   * @param {number} limit - Número máximo de resultados
   * @returns {Promise<Array>} - Productos relevantes
   */
  async searchProducts(query, limit = 5) {
    try {
      if (!this.ragService) {
        console.warn('⚠️ Servicio RAG no inicializado');
        return [];
      }

      const results = await this.ragService.search(query, limit);

      // Convertir resultados a productos
      const products = results.map(result => {
        const productId = result.metadata?.productId;
        const product = this.productsCache.find(p => p._id === productId);

        return {
          ...product,
          relevanceScore: result.similarity,
          matchedContent: result.content
        };
      }).filter(Boolean);

      return products;

    } catch (error) {
      console.error('❌ Error buscando productos:', error);
      return [];
    }
  }

  /**
   * Obtiene información general de productos disponibles
   * @returns {Object} - Resumen de productos disponibles
   */
  getProductsSummary() {
    if (this.productsCache.length === 0) {
      return {
        totalProducts: 0,
        categories: [],
        priceRange: { min: 0, max: 0 }
      };
    }

    const categories = [...new Set(this.productsCache.map(p => p.category))];
    const prices = this.productsCache.map(p => p.offerPrice);

    return {
      totalProducts: this.productsCache.length,
      categories: categories.map(cat => this.getCategoryInfo(cat).displayName),
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      }
    };
  }

  /**
   * Genera contexto para el chat sobre productos
   * @param {string} query - Consulta del usuario (opcional)
   * @returns {Promise<string>} - Contexto formateado
   */
  async generateContext(query = '') {
    try {
      let context = '';

      // Información general de la tienda
      context += `INFORMACIÓN DE LA TIENDA:\n`;
      context += `Somos una tienda en línea especializada en productos tecnológicos.\n`;
      context += `Ofrecemos productos de las siguientes categorías: ${this.getProductsSummary().categories.join(', ')}.\n\n`;

      // Si hay una consulta específica, buscar productos relevantes
      if (query.trim()) {
        const relevantProducts = await this.searchProducts(query, 3);

        if (relevantProducts.length > 0) {
          context += `PRODUCTOS RELEVANTES PARA TU CONSULTA:\n`;
          relevantProducts.forEach((product, index) => {
            context += `${index + 1}. ${product.name}\n`;
            context += `   - Categoría: ${this.getCategoryInfo(product.category).displayName}\n`;
            context += `   - Precio: Q${product.offerPrice}\n`;
            context += `   - Descripción: ${product.description.substring(0, 100)}...\n\n`;
          });
        }
      } else {
        // Información general cuando no hay consulta específica
        const summary = this.getProductsSummary();
        context += `RESUMEN DE PRODUCTOS DISPONIBLES:\n`;
        context += `- Total de productos: ${summary.totalProducts}\n`;
        context += `- Categorías: ${summary.categories.join(', ')}\n`;
        context += `- Rango de precios: Q${summary.priceRange.min} - Q${summary.priceRange.max}\n\n`;
      }

      // Instrucciones para el asistente
      context += `INSTRUCCIONES PARA EL ASISTENTE:\n`;
      context += `- Sé amable y profesional\n`;
      context += `- Proporciona información precisa sobre productos y precios\n`;
      context += `- Si no tienes información sobre un producto específico, indícalo claramente\n`;
      context += `- Ofrece alternativas similares si es apropiado\n`;
      context += `- Siempre menciona que los precios están en Quetzales (Q)\n`;
      context += `- Sugiere visitar la página web para ver detalles completos\n\n`;

      return context;

    } catch (error) {
      console.error('❌ Error generando contexto:', error);
      return 'Error generando contexto de productos.';
    }
  }

  /**
   * Actualiza el contexto con productos frescos
   * @param {Array} products - Array actualizado de productos
   */
  async updateProducts(products) {
    try {
      console.log('🔄 Actualizando contexto de productos...');
      await this.initialize(products);
    } catch (error) {
      console.error('❌ Error actualizando productos:', error);
    }
  }

  /**
   * Obtiene estadísticas del contexto
   * @returns {Object} - Estadísticas del servicio
   */
  getStats() {
    if (!this.ragService) {
      return { status: 'no_initialized' };
    }

    const ragStats = this.ragService.getStats();
    const summary = this.getProductsSummary();

    return {
      status: 'active',
      lastUpdate: this.lastUpdate,
      productsCount: summary.totalProducts,
      categories: summary.categories,
      ...ragStats
    };
  }
}

// Instancia global del servicio
export const productContextService = new ProductContextService();
