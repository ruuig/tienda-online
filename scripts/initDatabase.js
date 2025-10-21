// Script para inicializar la base de datos con datos de prueba
// Ejecutar: node scripts/initDatabase.js

const connectDB = (await import('../src/infrastructure/database/db.js')).default;
const { Conversation, Message, Document } = await import('../src/infrastructure/database/models/index.js');

async function initDatabase() {
  try {
    console.log('🔄 Inicializando base de datos...');

    await connectDB();

    // Crear documentos de prueba para RAG
    const sampleDocuments = [
      {
        title: 'Política de Devoluciones',
        content: `POLÍTICA DE DEVOLUCIONES

Tienes 30 días naturales para devolver cualquier producto comprado en nuestra tienda, siempre y cuando:

1. El producto esté en su estado original y sin usar
2. Conserves el empaque original y todos los accesorios
3. Presentes la factura de compra

EXCEPCIONES:
- Productos personalizados o bajo pedido especial
- Software o contenido digital ya descargado
- Productos perecederos

PROCEDIMIENTO:
1. Contacta nuestro servicio de atención al cliente
2. Empaca el producto de forma segura
3. Envía a nuestra dirección de devoluciones
4. Recibirás el reembolso en 5-7 días hábiles`,
        type: 'policy',
        category: 'returns',
        tags: ['devoluciones', 'garantía', 'reembolso'],
        isActive: true
      },
      {
        title: 'Guía de Compra - iPhone 15',
        content: `GUÍA DE COMPRA - IPHONE 15

El iPhone 15 representa la última innovación de Apple con características revolucionarias:

ESPECIFICACIONES TÉCNICAS:
- Pantalla Super Retina XDR de 6.1 pulgadas
- Chip A17 Pro con Neural Engine mejorado
- Cámara principal de 48MP con estabilización óptica
- Autonomía de hasta 20 horas de vídeo
- Resistencia al agua IP68

MODELOS DISPONIBLES:
- iPhone 15: Modelo base con excelentes características
- iPhone 15 Plus: Versión más grande con mejor batería
- iPhone 15 Pro: Acabado premium en titanio
- iPhone 15 Pro Max: Máxima potencia y cámara

COLORES:
- Negro, Blanco, Azul, Verde, Rosa

ALMACENAMIENTO:
- 128GB, 256GB, 512GB, 1TB (según modelo)

PRECIO DESDE: Q8,500`,
        type: 'guide',
        category: 'products',
        tags: ['iphone', 'apple', 'smartphone', 'guía'],
        isActive: true
      },
      {
        title: 'Tiempos de Envío y Entrega',
        content: `TIEMPOS DE ENVÍO Y ENTREGA

ZONA METROPOLITANA:
- Entrega estándar: 1-2 días hábiles
- Entrega express: 4-6 horas (costo adicional)
- Recogida en tienda: Disponible inmediatamente

DEPARTAMENTOS:
- Entrega estándar: 2-4 días hábiles
- Entrega express: 1-2 días hábiles (costo adicional)

POLÍTICA DE ENVÍO GRATUITO:
- Compras mayores a Q500: Envío gratuito estándar
- Compras menores a Q500: Q50 costo de envío
- Envío express siempre tiene costo adicional

SEGUIMIENTO:
- Recibirás un número de guía por correo electrónico
- Puedes rastrear tu pedido en nuestra web
- Te notificaremos cualquier retraso

CONTACTO:
- WhatsApp: +502 1234-5678
- Email: envios@tienda.com
- Teléfono: 1234-5678`,
        type: 'policy',
        category: 'shipping',
        tags: ['envío', 'entrega', 'seguimiento'],
        isActive: true
      }
    ];

    // Insertar documentos de prueba
    for (const docData of sampleDocuments) {
      const existingDoc = await Document.findOne({ title: docData.title });
      if (!existingDoc) {
        await Document.create(docData);
        console.log(`✅ Documento creado: ${docData.title}`);
      } else {
        console.log(`⚡ Documento ya existe: ${docData.title}`);
      }
    }

    console.log('🎉 Base de datos inicializada exitosamente!');
    console.log('📚 Documentos RAG disponibles para consultas');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar inicialización
initDatabase();
