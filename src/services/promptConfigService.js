// Servicio de configuración de prompts simplificado
export class PromptConfigService {
  constructor() {
    this.defaultPrompts = {
      systemMessage: {
        id: 'system_message',
        name: 'Mensaje del Sistema',
        content: `¡Hola! Soy tu asistente de compras virtual especializado ÚNICAMENTE en productos tecnológicos y compras en nuestra tienda online. 😊

⚠️ RESTRICCIONES IMPORTANTES:
- SOLO respondo preguntas relacionadas con productos tecnológicos (smartphones, laptops, audífonos, cámaras, etc.)
- NO respondo preguntas sobre temas generales, historia, matemáticas, programación avanzada, deportes, entretenimiento, salud, viajes, comida, moda, animales, arte, política, religión, economía, derecho, educación, trabajo o cualquier otro tema fuera del contexto tecnológico
- Si alguien pregunta sobre temas no relacionados, debo decir: "¡Hola! 😊 Soy un asistente especializado únicamente en productos tecnológicos y compras en nuestra tienda online. Para preguntas sobre [tema], te recomiendo consultar fuentes especializadas. ¿Te puedo ayudar con smartphones, laptops, audífonos u otros productos electrónicos? 🛒"

ESTOY AQUÍ PARA AYUDARTE:
- Te ayudo a encontrar productos perfectos para ti
- Puedo agregar productos a tu carrito de forma fácil y rápida
- Te guío paso a paso en tu proceso de compra
- Respondo todas tus dudas sobre productos y precios
- Comparo productos y características técnicas

ESTILO DE RESPUESTA:
- Soy alegre, entusiasta y súper amigable
- Uso emojis para hacer la conversación más divertida 🎉
- Mantengo las respuestas cortas y fáciles de entender
- Siempre ofrezco opciones claras y siguientes pasos

¡Estoy emocionado de ayudarte con tus compras tecnológicas! ¿Qué producto tecnológico te gustaría conocer hoy? 🛒✨`
      },

      offTopicResponse: {
        id: 'off_topic_response',
        name: 'Respuesta Temas Prohibidos',
        content: `¡Hola! 😊 Soy un asistente especializado únicamente en productos tecnológicos y compras en nuestra tienda online. Para preguntas sobre temas generales como {TOPIC}, te recomiendo consultar fuentes especializadas. ¿Te puedo ayudar con smartphones, laptops, audífonos u otros productos electrónicos? 🛒`
      }
    };
  }

  getPrompt(promptId) {
    return this.defaultPrompts[promptId] || null;
  }

  processPrompt(promptId, variables = {}) {
    const prompt = this.getPrompt(promptId);
    if (!prompt) return '';

    let content = prompt.content;

    // Reemplazar variables
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      content = content.replace(new RegExp(placeholder, 'g'), variables[key]);
    });

    return content;
  }

  generateSystemMessage(context = {}) {
    let systemMessage = this.getPrompt('systemMessage').content;

    // Agregar contexto de productos si está disponible
    if (context.products && context.products.length > 0) {
      const categories = [...new Set(context.products.map(p => p.category))];
      const categoryNames = {
        'smartphone': 'Smartphones',
        'laptop': 'Laptops/Computadoras',
        'headphone': 'Audífonos',
        'earphone': 'Earphones',
        'watch': 'Relojes Inteligentes',
        'camera': 'Cámaras',
        'accessories': 'Accesorios'
      };

      const displayCategories = categories.map(cat => categoryNames[cat] || cat).join(', ');
      const priceRange = context.products.length > 0 ? {
        min: Math.min(...context.products.map(p => p.offerPrice)),
        max: Math.max(...context.products.map(p => p.offerPrice))
      } : null;

      let productsSummary = `Tenemos ${context.products.length} productos disponibles en las siguientes categorías: ${displayCategories}.`;

      if (priceRange) {
        productsSummary += ` Los precios varían desde Q${priceRange.min} hasta Q${priceRange.max}.`;
      }

      systemMessage += `\n\n📦 PRODUCTOS DISPONIBLES:\n${productsSummary}`;
    }

    return systemMessage;
  }

  getOffTopicResponse(topic) {
    return this.processPrompt('offTopicResponse', { TOPIC: topic });
  }
}

export const createPromptConfigService = () => {
  return new PromptConfigService();
};
