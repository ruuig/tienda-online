// Cliente para integración con OpenAI GPT-4
import OpenAI from 'openai';
import { createPromptConfigService } from '@/src/services/promptConfigService.js';

const promptConfigService = createPromptConfigService();
const OFF_TOPIC_TEMPLATE = '¡Hola! 😊 Soy un asistente especializado únicamente en productos tecnológicos y compras en RJG Tech Shop. Para preguntas sobre {TOPIC}, te recomiendo consultar fuentes especializadas. ¿Te puedo ayudar con smartphones, laptops, audífonos u otros productos electrónicos? 🛒';

export class OpenAIClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 8000, // 8 segundos timeout (reducido de 30s)
    });

    this.model = 'gpt-3.5-turbo'; // Usar GPT-3.5-turbo para respuestas más rápidas
    this.maxTokens = 200; // Reducir tokens para respuestas más concisas y rápidas
    this.temperature = 0.7; // Balance entre creatividad y consistencia
  }

  /**
   * Genera una respuesta usando GPT-3.5-turbo
   * @param {Array} messages - Array de mensajes en formato OpenAI
   * @param {Object} context - Contexto adicional (productos, documentos RAG, etc.)
   * @returns {Promise<string>} - Respuesta generada
   */
  async generateResponse(messages, context = {}) {
    try {
      console.log('OpenAIClient: Generando respuesta...');
      console.log('OpenAIClient: Número de mensajes:', messages.length);
      console.log('OpenAIClient: Contexto recibido:', Object.keys(context));

      // Construir mensajes con contexto del sistema
      const systemMessage = this.buildSystemMessage(context);
      const messagesWithContext = [systemMessage, ...messages];

      console.log('OpenAIClient: Mensajes para OpenAI:', messagesWithContext.length);
      console.log('OpenAIClient: Enviando solicitud a OpenAI...');

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messagesWithContext,
        max_tokens: this.maxTokens, // 200 tokens para respuestas rápidas
        temperature: this.temperature,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false // No usar streaming por simplicidad
      });

      console.log('OpenAIClient: Respuesta recibida de OpenAI');
      const generatedText = response.choices[0]?.message?.content?.trim();
      console.log('OpenAIClient: Texto generado:', generatedText?.substring(0, 100));

      if (!generatedText) {
        throw new Error('No se pudo generar una respuesta válida');
      }

      return generatedText;

    } catch (error) {
      console.error('OpenAIClient: Error generando respuesta:', error);
      console.error('OpenAIClient: Error code:', error.code);
      console.error('OpenAIClient: Error message:', error.message);

      // Manejar diferentes tipos de errores
      if (error.code === 'rate_limit_exceeded') {
        throw new Error('Límite de consultas excedido. Inténtalo más tarde.');
      }

      if (error.code === 'insufficient_quota') {
        throw new Error('Cuota de OpenAI insuficiente. Contacta al administrador.');
      }

      if (error.code === 'invalid_api_key') {
        throw new Error('Error de configuración de OpenAI. Contacta al administrador.');
      }

      throw new Error('Error generando respuesta automática. Un agente te ayudará pronto.');
    }
  }

  /**
   * Construye el mensaje del sistema con contexto de RJG Tech Shop
   * @param {Object} context - Información contextual
   * @returns {Object} - Mensaje del sistema
   */
  buildSystemMessage(context) {
    const ragSnippets = Array.isArray(context?.ragSnippets) ? context.ragSnippets : [];

    const ragDetails = ragSnippets.length > 0
      ? `\n\nINFO RELEVANTE:\n${ragSnippets.slice(0, 1).map(snippet => `[#${snippet.index}] ${snippet.title}${snippet.source ? ` (${snippet.source})` : ''}\n${snippet.excerpt.substring(0, 100)}...`).join('\n\n')}`
      : '';

    const baseInstructions = `Eres un asistente de atención al cliente para RJG Tech Shop, una tienda online especializada en tecnología y productos electrónicos.

🎯 PERSONALIDAD Y TONO:
- Sé amable, profesional y servicial
- Responde en español de manera clara y concisa
- Mantén un tono profesional y servicial
- NUNCA hagas bromas, chistes o comentarios informales
- Evita respuestas especulativas o información falsa

🏬 INFORMACIÓN DE RJG TECH SHOP:
Somos una tienda online especializada en tecnología y productos electrónicos, comprometidos con brindar la mejor experiencia de compra.

🎯 MISIÓN:
Proporcionar productos tecnológicos de alta calidad, con servicio excepcional y precios competitivos, haciendo que la tecnología sea accesible para todos.

👁️ VISIÓN:
Ser la tienda online líder en tecnología en Guatemala, reconocida por su innovación, calidad y compromiso con la satisfacción del cliente.

💡 VALORES:
- Calidad: Productos originales con garantía del fabricante
- Servicio: Atención personalizada y soporte técnico especializado
- Precios Competitivos: Promociones exclusivas y descuentos constantes

📞 INFORMACIÓN DE CONTACTO:
- Dirección: Parque El Calvario, Chiquimula, Guatemala, C.A.
- Teléfonos: +502 5712-0482, +502 4002-6108, +502 3696-7266
- Correo: soporterjgtechshop@gmail.com
- Horario: Lunes a Viernes 8:00 AM – 6:00 PM, Sábados 9:00 AM – 4:00 PM

👨‍💼 NUESTRO EQUIPO:
- Rudy Eleazar Oloroso Gutierrez – CEO & Founder
- Jan Carlos René Marcos Marín – Director de Estrategia Comercial
- Gerardo Waldemar García Vásquez – Director Técnico

💬 PREGUNTAS FRECUENTES:
1. ¿Cómo hacer un pedido? Realizarlo desde nuestra tienda online, agregar al carrito y pagar de forma segura.
2. ¿Métodos de pago? Tarjetas de crédito/débito, transferencias bancarias, pago contra entrega.
3. ¿Tiempo de entrega? 2–3 días en capital, 3–5 días en interior.
4. ¿Garantía? Sí, todos los productos incluyen garantía del fabricante (6 meses a 2 años).

INSTRUCCIONES DE RESPUESTA:
- Responde ÚNICAMENTE sobre productos, servicios y procesos de RJG Tech Shop
- Si la consulta es sobre temas NO relacionados, recházala amablemente usando la plantilla
- Proporciona información precisa sobre productos y precios en Quetzales (Q)
- Sugiere visitar la página web para detalles completos
- Ofrece alternativas similares cuando sea apropiado
- Mantén respuestas profesionales y serviciales

${context.products ? `PRODUCTOS DISPONIBLES: ${context.productsSummary || 'Consulta nuestro catálogo en línea'}` : ''}${ragDetails}

Responde de manera útil y orientada al cliente, siempre en español y con tono profesional.`;

    return {
      role: 'system',
      content: baseInstructions
    };
  }

  /**
   * Procesa una consulta con información RAG
   * @param {string} query - Consulta del usuario
   * @param {Array} relevantDocuments - Documentos relevantes encontrados
   * @returns {Promise<string>} - Respuesta generada
   */
  async generateRAGResponse(query, relevantDocuments = []) {
    try {
      const context = {
        documents: relevantDocuments.map(doc => ({
          title: doc.title,
          content: doc.content.substring(0, 500), // Limitar tamaño
          category: doc.category,
          type: doc.type
        }))
      };

      const messages = [
        {
          role: 'user',
          content: `Consulta del cliente: ${query}\n\nInformación relevante encontrada:\n${relevantDocuments.map((doc, i) => `[${i+1}] ${doc.title}: ${doc.content.substring(0, 300)}...`).join('\n')}`
        }
      ];

      return await this.generateResponse(messages, context);

    } catch (error) {
      console.error('Error generando respuesta RAG:', error);
      throw new Error('Error procesando consulta con documentos de soporte');
    }
  }

  /**
   * Genera sugerencias de respuesta para agentes humanos
   * @param {string} customerQuery - Consulta del cliente
   * @param {Array} conversationHistory - Historial de conversación
   * @returns {Promise<Array>} - Array de sugerencias
   */
  async generateResponseSuggestions(customerQuery, conversationHistory = []) {
    try {
      const messages = [
        {
          role: 'system',
          content: 'Eres un asistente que genera sugerencias de respuesta para agentes de atención al cliente. Genera 3 respuestas cortas y útiles diferentes para la consulta del cliente.'
        },
        {
          role: 'user',
          content: `Consulta del cliente: ${customerQuery}\n\nHistorial de conversación:\n${conversationHistory.slice(-3).map(m => `${m.sender}: ${m.content}`).join('\n')}`
        }
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 300,
        temperature: 0.8,
        n: 3 // Generar 3 sugerencias
      });

      return response.choices.map(choice => choice.message.content.trim());

    } catch (error) {
      console.error('Error generando sugerencias:', error);
      return [
        'Lo siento, no pude generar sugerencias en este momento.',
        'Un agente especializado te ayudará con tu consulta.',
        'Gracias por tu paciencia mientras te conectamos con soporte.'
      ];
    }
  }

  /**
   * Clasifica la intención de la consulta del usuario
   * @param {string} message - Mensaje del usuario
   * @returns {Promise<Object>} - Objeto con intención y confianza
   */
  async classifyIntent(message) {
    try {
      console.log('OpenAIClient: Clasificando intención para mensaje:', message.substring(0, 50));

      const messages = [
        {
          role: 'system',
          content: `Clasifica la intención del mensaje del cliente en una de estas categorías:

          CATEGORÍAS DE CONSULTA:
          - consulta_producto: Preguntas sobre productos específicos o catálogo general
          - consulta_pedido: Seguimiento de pedidos o problemas con órdenes existentes
          - consulta_tecnica: Problemas técnicos o soporte técnico
          - consulta_devolucion: Políticas de devolución o cambios
          - consulta_envio: Información sobre envíos y entregas
          - saludo: Saludos o conversaciones casuales
          - queja: Quejas o problemas con el servicio

          CATEGORÍAS DE COMPRA CONVERSACIONAL:
          - compra_producto: Quiere comprar un producto específico que mencionó
          - agregar_carrito: Quiere agregar productos al carrito de compra
          - ver_carrito: Quiere ver el contenido del carrito
          - modificar_carrito: Quiere cambiar cantidades o remover productos del carrito
          - proceder_pago: Quiere proceder al pago o finalizar la compra
          - confirmar_compra: Confirmación de detalles antes de comprar
          - cancelar_compra: Quiere cancelar el proceso de compra

          OTRAS:
          - otra: Cualquier otra consulta que no encaje en las categorías anteriores

          REGLAS ESPECÍFICAS PARA COMPRA:
          - Si menciona un producto específico y dice "comprar", "adquirir", "me interesa", usa "compra_producto"
          - Si dice "agregar al carrito", "añadir al carrito", usa "agregar_carrito"
          - Si dice "ver carrito", "qué tengo en el carrito", usa "ver_carrito"
          - Si dice "proceder al pago", "pagar", "checkout", usa "proceder_pago"
          - Si pregunta por precios o disponibilidad con intención clara de compra, usa "compra_producto"

          Responde únicamente con el formato JSON: {"intent": "categoria", "confidence": 0.95}`
        },
        {
          role: 'user',
          content: message
        }
      ];

      console.log('OpenAIClient: Enviando solicitud de clasificación a OpenAI...');
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 10, // Solo 10 tokens para respuestas ultra-rápidas
        temperature: 0.1, // Más determinista para clasificación
        response_format: { type: "json_object" }
      });

      console.log('OpenAIClient: Respuesta de clasificación recibida');
      const result = JSON.parse(response.choices[0]?.message?.content || '{"intent": "otra", "confidence": 0.5}');

      return {
        intent: result.intent || 'otra',
        confidence: result.confidence || 0.5
      };

    } catch (error) {
      console.error('OpenAIClient: Error clasificando intención:', error);
      return {
        intent: 'otra',
        confidence: 0.5
      };
    }
  }

  /**
   * Verifica el estado de la API de OpenAI
   * @returns {Promise<boolean>} - True si la API está disponible
   */
  async checkHealth() {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('Error verificando salud de OpenAI:', error);
      return false;
    }
  }
}

// Factory function para crear cliente OpenAI con configuración
export const createOpenAIClient = (apiKey) => {
  return new OpenAIClient(apiKey);
};
