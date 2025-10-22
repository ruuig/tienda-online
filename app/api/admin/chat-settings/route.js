// API para configuración del chat del administrador
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();

    // Validar que el usuario sea seller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('seller@tienda.com')) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Validar configuración
    const requiredFields = [
      'maxResponseLength', 'enableProductCards', 'enablePurchaseFlow',
      'enableRAG', 'welcomeMessage', 'storeHours', 'contactInfo',
      'restrictedTopics', 'allowedTopics'
    ];

    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { success: false, message: `Campo requerido faltante: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validar tipos de datos
    if (typeof body.maxResponseLength !== 'number' || body.maxResponseLength < 100 || body.maxResponseLength > 2000) {
      return NextResponse.json(
        { success: false, message: 'maxResponseLength debe ser un número entre 100 y 2000' },
        { status: 400 }
      );
    }

    if (typeof body.enableProductCards !== 'boolean' ||
        typeof body.enablePurchaseFlow !== 'boolean' ||
        typeof body.enableRAG !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Los campos boolean deben ser true o false' },
        { status: 400 }
      );
    }

    // Guardar configuración en archivo (en producción usar base de datos)
    const fs = await import('fs');
    const path = await import('path');

    const configPath = path.join(process.cwd(), 'config', 'chatSettings.json');

    // Crear directorio si no existe
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Guardar configuración
    fs.writeFileSync(configPath, JSON.stringify(body, null, 2));

    console.log('✅ Configuración del chat guardada por seller:', {
      timestamp: new Date().toISOString(),
      user: 'seller@tienda.com',
      settings: body
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente',
      settings: body
    });

  } catch (error) {
    console.error('❌ Error guardando configuración del chat:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Validar que el usuario sea seller
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('seller@tienda.com')) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const fs = await import('fs');
    const path = await import('path');

    const configPath = path.join(process.cwd(), 'config', 'chatSettings.json');

    // Configuración por defecto si no existe archivo
    const defaultSettings = {
      maxResponseLength: 500,
      enableProductCards: true,
      enablePurchaseFlow: true,
      enableRAG: true,
      welcomeMessage: '¡Hola! ¿En qué puedo ayudarte hoy?',
      storeHours: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
      contactInfo: 'Tel: (502) 1234-5678 | Email: info@tienda.com',
      restrictedTopics: [
        'política', 'religión', 'deportes', 'entretenimiento',
        'ciencia general', 'historia', 'geografía', 'matemáticas'
      ],
      allowedTopics: [
        'productos', 'precios', 'compras', 'carrito', 'envío',
        'devoluciones', 'garantía', 'soporte técnico', 'tecnología'
      ]
    };

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
        isDefault: true
      });
    }

    const configData = fs.readFileSync(configPath, 'utf8');
    const settings = JSON.parse(configData);

    return NextResponse.json({
      success: true,
      settings,
      isDefault: false
    });

  } catch (error) {
    console.error('❌ Error obteniendo configuración del chat:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
