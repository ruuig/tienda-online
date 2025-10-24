// API para configuración de prompts del vendedor
import { NextResponse } from 'next/server';
import connectDB from '@/src/infrastructure/database/db.js';
import { models } from '@/src/infrastructure/database/models/index.js';

export async function GET(request) {
  try {
    await connectDB();

    // TODO: Validar autenticación de vendedor
    const vendorId = '507f1f77bcf86cd799439011'; // Temporal

    // Obtener configuración actual
    let config = await models.PromptConfig.findOne({ vendorId, isActive: true });

    if (!config) {
      // Retornar configuración por defecto
      return NextResponse.json({
        success: true,
        config: {
          systemPrompt: `¡Hola! Soy tu asistente de compras virtual especializado ÚNICAMENTE en productos tecnológicos y compras en nuestra tienda online. 😊

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

¡Estoy emocionado de ayudarte con tus compras tecnológicas! ¿Qué producto tecnológico te gustaría conocer hoy? 🛒✨`,
          greetingMessage: '¡Hola! ¿En qué puedo ayudarte hoy?',
          rejectionMessage: '¡Hola! 😊 Soy un asistente especializado únicamente en productos tecnológicos y compras en nuestra tienda online. Para preguntas sobre temas generales como {TOPIC}, te recomiendo consultar fuentes especializadas. ¿Te puedo ayudar con smartphones, laptops, audífonos u otros productos electrónicos? 🛒',
          allowedTopics: ['productos', 'precios', 'envíos', 'pagos', 'garantías'],
          temperature: 0.7,
          maxTokens: 500,
          model: 'gpt-4'
        }
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        id: config._id,
        systemPrompt: config.systemPrompt,
        greetingMessage: config.greetingMessage,
        rejectionMessage: config.rejectionMessage,
        allowedTopics: config.allowedTopics,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        model: config.model,
        version: config.version,
        updatedAt: config.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo configuración de prompts:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      systemPrompt,
      greetingMessage,
      rejectionMessage,
      allowedTopics,
      temperature,
      maxTokens,
      model
    } = body;

    // TODO: Validar autenticación de vendedor
    const vendorId = '507f1f77bcf86cd799439011'; // Temporal

    // Validaciones
    if (!systemPrompt || !greetingMessage || !rejectionMessage) {
      return NextResponse.json(
        { success: false, message: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }

    if (temperature < 0 || temperature > 2) {
      return NextResponse.json(
        { success: false, message: 'Temperature debe estar entre 0 y 2' },
        { status: 400 }
      );
    }

    if (maxTokens < 100 || maxTokens > 2000) {
      return NextResponse.json(
        { success: false, message: 'MaxTokens debe estar entre 100 y 2000' },
        { status: 400 }
      );
    }

    // Buscar configuración existente
    const existingConfig = await models.PromptConfig.findOne({ vendorId });

    if (existingConfig) {
      // Actualizar configuración existente
      existingConfig.systemPrompt = systemPrompt;
      existingConfig.greetingMessage = greetingMessage;
      existingConfig.rejectionMessage = rejectionMessage;
      existingConfig.allowedTopics = allowedTopics || existingConfig.allowedTopics;
      existingConfig.temperature = temperature;
      existingConfig.maxTokens = maxTokens;
      existingConfig.model = model || existingConfig.model;
      existingConfig.updatedBy = vendorId;

      await existingConfig.save();
    } else {
      // Crear nueva configuración
      await models.PromptConfig.create({
        vendorId,
        systemPrompt,
        greetingMessage,
        rejectionMessage,
        allowedTopics: allowedTopics || ['productos', 'precios', 'envíos', 'pagos', 'garantías'],
        temperature,
        maxTokens,
        model: model || 'gpt-4',
        updatedBy: vendorId
      });
    }

    console.log('✅ Configuración de prompts actualizada:', {
      vendorId,
      version: existingConfig ? existingConfig.version + 1 : 1,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando configuración de prompts:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();

    // TODO: Validar autenticación de vendedor
    const vendorId = '507f1f77bcf86cd799439011'; // Temporal

    // Desactivar configuración actual
    await models.PromptConfig.findOneAndUpdate(
      { vendorId, isActive: true },
      { isActive: false, updatedAt: new Date() }
    );

    console.log('✅ Configuración de prompts desactivada:', {
      vendorId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración desactivada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error desactivando configuración de prompts:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
