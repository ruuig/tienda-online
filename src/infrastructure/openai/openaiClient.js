// Cliente para integración con OpenAI
import OpenAI from 'openai';
import { createPromptConfigService } from '@/src/services/promptConfigService.js';

const promptConfigService = createPromptConfigService();
const OFF_TOPIC_TEMPLATE =
  promptConfigService.getPrompt('offTopicResponse')?.content ||
  '¡Hola! 😊 Soy un asistente especializado únicamente en productos tecnológicos y compras en nuestra tienda online. ' +
  'Para preguntas sobre {TOPIC}, te recomiendo consultar fuentes especializadas. ¿Te puedo ayudar con smartphones, laptops, audífonos u otros productos electrónicos? 🛒';

export class OpenAIClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 30000, // 30s timeout
    });

    // Permite override por env si lo necesitas (ej. OPENAI_MODEL=gpt-4o-mini)
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = 500;
    this.temperature = 0.7;
    this.maxPromptCharacters = 12000;
  }

  /**
   * Genera una respuesta usando el modelo configurado
   * @param {Array} messages - [{role, content}]
   * @param {Object} context - contexto opcional
   * @returns {Promise<string>}
   */
  async generateResponse(messages, context = {}) {
    try {
      console.log('OpenAIClient: Generando respuesta...');
      const preparedMessages = Array.isArray(messages) ? [...messages] : [];
      const hasSystemMessage = preparedMessages.some((message) => message?.role === 'system');
      const baseMessages = hasSystemMessage
        ? preparedMessages
        : [this.buildSystemMessage(context), ...preparedMessages];
      const messagesWithContext = this.truncateMessages(baseMessages);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messagesWithContext,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false,
      });

      const generatedText = response.choices?.[0]?.message?.content?.trim();
      if (!generatedText) throw new Error('No se pudo generar una respuesta válida');
      return generatedText;
    } catch (error) {
      console.error('OpenAIClient: Error generando respuesta:', error);
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

  truncateMessages(messages = []) {
    if (!Array.isArray(messages) || !messages.length) {
      return [];
    }

    if (!this.maxPromptCharacters) {
      return messages;
    }

    const systemMessages = messages.filter((message) => message?.role === 'system');
    const conversationMessages = messages.filter((message) => message?.role !== 'system');

    let accumulatedLength = 0;
    const keptMessages = [];

    for (let index = conversationMessages.length - 1; index >= 0; index -= 1) {
      const message = conversationMessages[index];
      const contentLength = message?.content?.length || 0;

      if (accumulatedLength + contentLength > this.maxPromptCharacters && keptMessages.length > 0) {
        continue;
      }

      accumulatedLength += contentLength;
      keptMessages.push(message);

      if (accumulatedLength >= this.maxPromptCharacters) {
        break;
      }
    }

    keptMessages.reverse();

    return [...systemMessages, ...keptMessages];
  }

  /**
   * Construye el mensaje del sistema con contexto de la tienda
   */
  buildSystemMessage(context) {
    const ragSnippets = Array.isArray(context?.ragSnippets) ? context.ragSnippets : [];
    const ragSources = Array.isArray(context?.ragSources) ? context.ragSources : [];

    const ragDetails =
      ragSnippets.length > 0
        ? `\n\nDOCUMENTOS DISPONIBLES PARA SOPORTE:\n${ragSnippets
            .map(
              (s) =>
                `[#${s.index}] ${s.title}${s.source ? ` (Fuente: ${s.source})` : ''}\n${s.excerpt}`
            )
            .join('\n\n')}`
        : '';

    const ragGuidelines =
      ragSnippets.length > 0
        ? `\n\nGUÍA DE CITAS:\n- Usa los fragmentos solo si son relevantes para la consulta.\n- Cita la fuente utilizando el identificador [#n] correspondiente.\n- Si la información no está disponible, indícalo y ofrece escalar a un agente.`
        : '';

    const ragSourceSummary =
      ragSources.length > 0
        ? `\n\nFUENTES REFERENCIALES:\n${ragSources
            .map((src) => `[#${src.index}] ${src.title || 'Documento'}${src.source ? ` — ${src.source}` : ''}`)
            .join('\n')}`
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
${context.documents ? `INFORMACIÓN DE SOPORTE: ${context.documents.map((d) => d.title).join(', ')}` : ''}${ragDetails}${ragSourceSummary}${ragGuidelines}

Responde siempre de manera útil y orientada al cliente.`;

    return { role: 'system', content: baseInstructions };
  }

  /**
   * Procesa una consulta con documentos RAG
   */
  async generateRAGResponse(query, relevantDocuments = []) {
    try {
      const context = {
        documents: relevantDocuments.map((doc) => ({
          title: doc.title,
          content: (doc.content || '').substring(0, 500),
          category: doc.category,
          type: doc.type,
        })),
      };

      const messages = [
        {
          role: 'user',
          content: `Consulta del cliente: ${query}\n\nInformación relevante encontrada:\n${relevantDocuments
            .map((doc, i) => `[${i + 1}] ${doc.title}: ${(doc.content || '').substring(0, 300)}...`)
            .join('\n')}`,
        },
      ];

      return await this.generateResponse(messages, context);
    } catch (error) {
      console.error('Error generando respuesta RAG:', error);
      throw new Error('Error procesando consulta con documentos de soporte');
    }
  }

  /**
   * Genera sugerencias para agentes humanos
   */
  async generateResponseSuggestions(customerQuery, conversationHistory = []) {
    try {
      const messages = [
        {
          role: 'system',
          content:
            'Eres un asistente que genera sugerencias de respuesta para agentes de atención al cliente. Genera 3 respuestas cortas y útiles diferentes para la consulta del cliente.',
        },
        {
          role: 'user',
          content: `Consulta del cliente: ${customerQuery}\n\nHistorial de conversación:\n${conversationHistory
            .slice(-3)
            .map((m) => `${m.sender}: ${m.content}`)
            .join('\n')}`,
        },
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 300,
        temperature: 0.8,
        n: 3,
      });

      return response.choices.map((c) => c.message.content.trim());
    } catch (error) {
      console.error('Error generando sugerencias:', error);
      return [
        'Lo siento, no pude generar sugerencias en este momento.',
        'Un agente especializado te ayudará con tu consulta.',
        'Gracias por tu paciencia mientras te conectamos con soporte.',
      ];
    }
  }

  /**
   * Clasifica la intención del usuario (sin response_format para evitar 400)
   */
  async classifyIntent(message) {
    try {
      console.log(
        'OpenAIClient: Clasificando intención para mensaje:',
        String(message || '').substring(0, 50)
      );

      const messages = [
        {
          role: 'system',
          content: `Clasifica la intención del mensaje del cliente en una de estas categorías:

CATEGORÍAS DE CONSULTA:
- consulta_producto
- consulta_pedido
- consulta_tecnica
- consulta_devolucion
- consulta_envio
- saludo
- queja

CATEGORÍAS DE COMPRA CONVERSACIONAL:
- compra_producto
- agregar_carrito
- ver_carrito
- modificar_carrito
- proceder_pago
- confirmar_compra
- cancelar_compra

OTRAS:
- otra

REGLAS:
- Si menciona un producto específico y dice "comprar", "adquirir", "me interesa", usa "compra_producto"
- Si dice "agregar al carrito", "añadir al carrito", usa "agregar_carrito"
- Si dice "ver carrito", usa "ver_carrito"
- Si dice "proceder al pago", "pagar", "checkout", usa "proceder_pago"
- Si pregunta por precios o disponibilidad con intención clara de compra, usa "compra_producto"

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{"intent":"categoria","confidence":0.95}`,
        },
        { role: 'user', content: String(message || '') },
      ];

      // IMPORTANTE: sin response_format para evitar el 400
      const resp = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 80,
        temperature: 0.1, // Más determinista para clasificación
      });

      const raw = resp.choices?.[0]?.message?.content || '';
      const parsed = this.#safeParseJson(raw);

      return {
        intent: parsed.intent || 'otra',
        confidence:
          typeof parsed.confidence === 'number' && !Number.isNaN(parsed.confidence)
            ? parsed.confidence
            : 0.5,
      };
    } catch (error) {
      console.error('OpenAIClient: Error clasificando intención:', error);
      return { intent: 'otra', confidence: 0.5 };
    }
  }

  /**
   * Pequeño parser robusto para cuando el modelo devuelva texto + JSON
   * Intenta extraer el primer bloque { ... } y hacer JSON.parse.
   * Si falla, retorna objeto por defecto.
   */
  #safeParseJson(text) {
    try {
      // Intento directo
      return JSON.parse(text);
    } catch (_) {
      // Extraer primer bloque {...}
      const match = String(text).match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e2) {
          console.warn('OpenAIClient: JSON embebido inválido. Devolviendo defaults.');
        }
      }
      return { intent: 'otra', confidence: 0.5 };
    }
  }

  /**
   * Healthcheck simple
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

// Factory
export const createOpenAIClient = (apiKey) => new OpenAIClient(apiKey);
