/**
 * Servicio de contexto de productos para el chat
 * Convierte productos en documentos RAG y proporciona funciones de búsqueda
 */

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

      // Guardar productos directamente sin usar RAGService
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
   * Genera contenido simplificado de un producto para el RAG
   * @param {Object} product - Producto
   * @returns {string} - Contenido formateado y corto
   */
  generateProductContent(product) {
    return `${product.name} - ${product.description.substring(0, 100)}... Categoría: ${product.category}. Precio: Q${product.offerPrice}.`.trim();
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
   * Busca productos relevantes para una consulta (versión simplificada y rápida)
   * @param {string} query - Consulta del usuario
   * @param {number} limit - Número máximo de resultados
   * @returns {Promise<Array>} - Productos relevantes
   */
  async searchProducts(query, limit = 5) {
    try {
      if (!this.productsCache || this.productsCache.length === 0) {
        console.warn('⚠️ No hay productos en cache');
        return [];
      }

      // Búsqueda simple por texto en lugar de RAG para mayor velocidad
      const lowerQuery = query.toLowerCase();
      const scoredProducts = [];

      for (const product of this.productsCache) {
        let score = 0;
        const lowerName = product.name.toLowerCase();
        const lowerDesc = product.description.toLowerCase();
        const lowerCategory = product.category.toLowerCase();

        // Búsqueda por nombre exacto (mayor peso)
        if (lowerName.includes(lowerQuery)) {
          score += 10;
        }

        // Búsqueda por categoría
        if (lowerCategory.includes(lowerQuery)) {
          score += 5;
        }

        // Búsqueda en descripción (menor peso)
        const queryWords = lowerQuery.split(' ').filter(word => word.length > 2);
        queryWords.forEach(word => {
          if (lowerName.includes(word)) score += 3;
          if (lowerDesc.includes(word)) score += 1;
        });

        if (score > 0) {
          scoredProducts.push({
            ...product,
            relevanceScore: score / 10 // Normalizar
          });
        }
      }

      // Ordenar por relevancia y limitar
      return scoredProducts
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

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
   * Genera contexto para el chat sobre productos e información de la tienda
   * @param {string} query - Consulta del usuario (opcional)
   * @returns {Promise<string>} - Contexto formateado
   */
  async generateContext(query = '') {
    try {
      let context = '';

      // Información General de RJG Tech Shop
      context += `INFORMACIÓN DE RJG TECH SHOP:\n`;
      context += `Somos una tienda online especializada en tecnología y productos electrónicos.\n`;
      context += `Comprometidos con brindar la mejor experiencia de compra a nuestros clientes.\n\n`;

      // Misión y Visión
      context += `NUESTRA MISIÓN:\n`;
      context += `Proporcionar productos tecnológicos de alta calidad, con servicio excepcional y precios competitivos, haciendo que la tecnología sea accesible para todos.\n\n`;

      context += `NUESTRA VISIÓN:\n`;
      context += `Ser la tienda online líder en tecnología en Guatemala, reconocida por su innovación, calidad y compromiso con la satisfacción del cliente.\n\n`;

      context += `NUESTROS VALORES:\n`;
      context += `- Calidad: Productos originales con garantía del fabricante\n`;
      context += `- Servicio: Atención personalizada y soporte técnico especializado\n`;
      context += `- Precios Competitivos: Promociones exclusivas y descuentos constantes\n\n`;

      // Información del Equipo
      context += `NUESTRO EQUIPO:\n`;
      context += `- Rudy Eleazar Oloroso Gutierrez – CEO & Founder (Coordinador de la empresa y del grupo de trabajo)\n`;
      context += `- Jan Carlos René Marcos Marín – Director de Estrategia Comercial (Planificación de ventas, análisis de mercado, tratos con proveedores)\n`;
      context += `- Gerardo Waldemar García Vásquez – Director Técnico (Especialista en tecnología e innovación, oferta actualizada)\n\n`;

      // Información de Contacto
      context += `INFORMACIÓN DE CONTACTO:\n`;
      context += `- Dirección: Parque El Calvario, Chiquimula, Guatemala, C.A.\n`;
      context += `- Teléfonos: +502 5712-0482, +502 4002-6108, +502 3696-7266\n`;
      context += `- Correo: soporterjgtechshop@gmail.com\n`;
      context += `- Horario de Atención:\n`;
      context += `  * Lunes a Viernes: 8:00 AM – 6:00 PM\n`;
      context += `  * Sábados: 9:00 AM – 4:00 PM\n`;
      context += `  * Domingos: Cerrado\n\n`;

      // Preguntas Frecuentes
      context += `PREGUNTAS FRECUENTES:\n`;
      context += `1. ¿Cómo hacer un pedido?\n`;
      context += `   - Realizarlo directamente desde nuestra tienda online\n`;
      context += `   - Agregar productos al carrito\n`;
      context += `   - Confirmar datos y realizar pago seguro\n\n`;
      context += `2. ¿Qué métodos de pago aceptan?\n`;
      context += `   - Tarjetas de crédito y débito\n`;
      context += `   - Transferencias bancarias\n`;
      context += `   - Pago contra entrega (según disponibilidad)\n\n`;
      context += `3. ¿Cuánto tarda la entrega?\n`;
      context += `   - 2–3 días hábiles dentro de la capital\n`;
      context += `   - 3–5 días en el interior del país\n\n`;
      context += `4. ¿Los productos tienen garantía?\n`;
      context += `   - Sí, todos incluyen garantía del fabricante\n`;
      context += `   - Duración: 6 meses a 2 años según modelo\n\n`;

      // Información de Productos
      const summary = this.getProductsSummary();
      if (summary.totalProducts > 0) {
        context += `PRODUCTOS DISPONIBLES:\n`;
        context += `- Total de productos: ${summary.totalProducts}\n`;
        context += `- Categorías: ${summary.categories.join(', ')}\n`;
        context += `- Rango de precios: Q${summary.priceRange.min} - Q${summary.priceRange.max}\n\n`;

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
        }
      }

      // Instrucciones para el Asistente
      context += `INSTRUCCIONES PARA EL ASISTENTE:\n`;
      context += `PERSONALIDAD:\n`;
      context += `- Tono: Amable, profesional y servicial\n`;
      context += `- Objetivo: Ayudar al cliente de forma clara, rápida y educada\n`;
      context += `- NUNCA hacer: Bromas, chistes, respuestas fuera del tema, opiniones personales, información falsa\n\n`;

      context += `REGLAS DE RESPUESTA:\n`;
      context += `- Siempre responder en español\n`;
      context += `- Mantener tono profesional y servicial\n`;
      context += `- Enfocarse únicamente en productos, servicios y procesos de la tienda\n`;
      context += `- Redirigir consultas fuera de tema hacia productos o servicios disponibles\n`;
      context += `- Proporcionar información precisa sobre productos y precios\n`;
      context += `- Mencionar que los precios están en Quetzales (Q)\n`;
      context += `- Sugerir visitar la página web para ver detalles completos\n\n`;

      context += `EJEMPLOS DE TONO CORRECTO:\n`;
      context += `- "¡Hola! 😊 Gracias por comunicarte con RJG Tech Shop. Con gusto te ayudo a encontrar el producto que necesitas."\n`;
      context += `- "¡Con gusto! 😊 ¿Podrías decirme el nombre o tipo de producto que buscas? Te ayudaré a encontrar la mejor opción."\n`;
      context += `- "Todos nuestros productos incluyen garantía del fabricante, con duración de 6 meses a 2 años según el artículo."\n\n`;

      context += `RESPUESTAS A EVITAR:\n`;
      context += `- Respuestas casuales o informales\n`;
      context += `- Información falsa o especulativa\n`;
      context += `- Comentarios personales o ajenos a la tienda\n`;
      context += `- "No sé, pero supongo que eso depende de ti 😅"\n\n`;

      return context;

    } catch (error) {
      console.error('❌ Error generando contexto:', error);
      return this.generateBasicContext();
    }
  }

  /**
   * Genera contexto básico cuando hay error
   * @returns {string} - Contexto básico de RJG Tech Shop
   */
  generateBasicContext() {
    return `INFORMACIÓN DE RJG TECH SHOP:

Somos una tienda online especializada en tecnología y productos electrónicos.

INFORMACIÓN DE CONTACTO:
- Dirección: Parque El Calvario, Chiquimula, Guatemala, C.A.
- Teléfonos: +502 5712-0482, +502 4002-6108, +502 3696-7266
- Correo: soporterjgtechshop@gmail.com
- Horario: Lunes a Viernes 8:00 AM – 6:00 PM, Sábados 9:00 AM – 4:00 PM

INSTRUCCIONES PARA EL ASISTENTE:
- Sé amable, profesional y servicial
- Responde en español de manera clara y concisa
- Enfócate únicamente en productos, servicios y procesos de la tienda
- Proporciona información precisa sobre productos y precios
- Menciona que los precios están en Quetzales (Q)

Tono correcto: "¡Hola! 😊 Gracias por comunicarte con RJG Tech Shop. Con gusto te ayudo a encontrar el producto que necesitas."`;
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
   * Obtiene documentos RAG disponibles para un proveedor
   * @param {string} vendorId - ID del proveedor
   * @returns {Promise<Array>} - Array de documentos activos
   */
  async getDocumentsForVendor(vendorId) {
    try {
      // Devolver información de RJG Tech Shop como documento principal
      const rjgTechShopDocument = {
        _id: 'rjg_tech_shop_info',
        title: 'Información General de RJG Tech Shop',
        content: this.generateBasicContext(),
        type: 'information',
        category: 'company',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date(),
        isActive: true,
        filename: 'rjg-tech-shop-info.txt',
        vendorId: vendorId
      };

      // TODO: Implementar consulta real a la base de datos cuando esté disponible
      return [rjgTechShopDocument];

    } catch (error) {
      console.error('Error getting documents for vendor:', error);
      return [];
    }
  }
}

// Instancia global del servicio
export const productContextService = new ProductContextService();
