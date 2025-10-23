// Cliente para integración con OpenAI GPT-4
import OpenAI from 'openai';
import { createPromptConfigService } from '@/src/services/promptConfigService.js';

const promptConfigService = createPromptConfigService();
const OFF_TOPIC_TEMPLATE = promptConfigService.getPrompt('offTopicResponse')?.content ||
  '¡Hola! 😊 Soy un asistente especializado únicamente en productos tecnológicos y compras en nuestra tienda online. ' +
  'Para preguntas sobre {TOPIC}, te recomiendo consultar fuentes especializadas. ¿Te puedo ayudar con smartphones, laptops, audífonos u otros productos electrónicos? 🛒';

export class OpenAIClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 30000, // 30 segundos timeout
    });

    this.model = 'gpt-4'; // Usar GPT-4 para mejores respuestas
    this.maxTokens = 500; // Limitar tokens para respuestas concisas
    this.temperature = 0.7; // Balance entre creatividad y consistencia
  }

  /**
   * Genera una respuesta usando GPT-4
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
        max_tokens: this.maxTokens,
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
   * Construye el mensaje del sistema con contexto de la tienda
   * @param {Object} context - Información contextual
   * @returns {Object} - Mensaje del sistema
   */
  buildSystemMessage(context) {
    const ragSnippets = Array.isArray(context?.ragSnippets) ? context.ragSnippets : [];
    const ragSources = Array.isArray(context?.ragSources) ? context.ragSources : [];

    const ragDetails = ragSnippets.length > 0
      ? `\n\nDOCUMENTOS DISPONIBLES PARA SOPORTE:\n${ragSnippets.map(snippet => `[#${snippet.index}] ${snippet.title}${snippet.source ? ` (Fuente: ${snippet.source})` : ''}\n${snippet.excerpt}`).join('\n\n')}`
      : '';

    const ragGuidelines = ragSnippets.length > 0
      ? `\n\nGUÍA DE CITAS:\n- Usa los fragmentos solo si son relevantes para la consulta.\n- Cita la fuente utilizando el identificador [#n] correspondiente.\n- Si la información no está disponible, indícalo y ofrece escalar a un agente.`
      : '';

    const ragSourceSummary = ragSources.length > 0
      ? `\n\nFUENTES REFERENCIALES:\n${ragSources.map(source => `[#${source.index}] ${source.title || 'Documento'}${source.source ? ` — ${source.source}` : ''}`).join('\n')}`
      : '';

    const baseInstructions = `Eres un asistente de atención al cliente para una tienda online de tecnología.

INSTRUCCIONES:
- Sé amable, profesional y útil
- Responde en español de manera clara y concisa
- Si no sabes algo, di "Déjame consultar con un agente especializado"
- Para consultas técnicas, proporciona información precisa basada en documentos disponibles
- Nunca inventes información sobre productos o políticas
- Si la consulta es sobre temas que NO están relacionados con la tienda ni la tecnología, recházala amablemente usando exactamente este mensaje (reemplaza {TOPIC} por el tema mencionado): "${OFF_TOPIC_TEMPLATE}"

CONTEXTO DE LA TIENDA:
- Somos especialistas en tecnología y productos electrónicos
- Ofrecemos garantía en todos nuestros productos
- Envío gratuito en compras mayores a Q500
- Políticas de devolución: 30 días para productos sin usar

${context.products ? `PRODUCTOS DISPONIBLES: ${JSON.stringify(context.products.slice(0, 5))}` : ''}
${context.documents ? `INFORMACIÓN DE SOPORTE: ${context.documents.map(d => d.title).join(', ')}` : ''}${ragDetails}${ragSourceSummary}${ragGuidelines}

Responde siempre de manera útil y orientada al cliente.`;

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
        max_tokens: 50,
        temperature: 0.3,
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
