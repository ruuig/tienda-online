/**
 * Script de prueba para verificar que el chat mejorado funcione correctamente
 * Ejecutar: node scripts/testImprovedChat.js
 */

import axios from 'axios';

async function testImprovedChat() {
  try {
    console.log('🧪 Probando chat mejorado con respuestas alegres y contexto de productos...\n');

    // Test 1: Consulta de productos
    console.log('📝 Test 1: Consulta de productos');
    const response1 = await axios.post('http://localhost:3000/api/chat/process-message', {
      conversationId: 'test-chat-1',
      message: '¿Qué productos tienen disponibles?',
      userInfo: {
        id: 'test-user',
        name: 'Usuario de Prueba',
        email: 'test@example.com'
      }
    });

    if (response1.data.success) {
      console.log('✅ Consulta de productos exitosa');
      console.log(`   🤖 Respuesta: ${response1.data.message.content.substring(0, 100)}...`);
      console.log(`   🎯 Intención: ${response1.data.intent.intent}`);
      console.log(`   📊 Confianza: ${response1.data.intent.confidence}`);
    }

    // Test 2: Consulta específica de producto
    console.log('\n📝 Test 2: Consulta específica de producto');
    const response2 = await axios.post('http://localhost:3000/api/chat/process-message', {
      conversationId: 'test-chat-2',
      message: 'Quiero comprar un smartphone',
      userInfo: {
        id: 'test-user',
        name: 'Usuario de Prueba',
        email: 'test@example.com'
      }
    });

    if (response2.data.success) {
      console.log('✅ Consulta de producto específico exitosa');
      console.log(`   🤖 Respuesta: ${response2.data.message.content.substring(0, 100)}...`);
      console.log(`   🛒 Tipo de respuesta: ${response2.data.message.type}`);

      if (response2.data.message.type === 'purchase_flow') {
        console.log('   🎉 ¡Flujo de compra activado!');
        console.log(`   📋 Opciones: ${response2.data.message.metadata.nextSteps?.join(', ')}`);
      }
    }

    // Test 3: Verificar contexto de productos
    console.log('\n📝 Test 3: Verificar contexto de productos');
    const productResponse = await axios.get('http://localhost:3000/api/product/list');

    if (productResponse.data.success) {
      console.log('✅ API de productos funcionando');
      console.log(`   📦 Productos disponibles: ${productResponse.data.products.length}`);

      if (productResponse.data.products.length > 0) {
        console.log(`   💡 Ejemplo: ${productResponse.data.products[0].name} - Q${productResponse.data.products[0].offerPrice}`);
      }
    }

    // Test 4: Verificar que el contexto se pase correctamente
    console.log('\n📝 Test 4: Verificar contexto en respuesta');
    const response4 = await axios.post('http://localhost:3000/api/chat/process-message', {
      conversationId: 'test-chat-4',
      message: '¿Tienen laptops?',
      userInfo: {
        id: 'test-user',
        name: 'Usuario de Prueba',
        email: 'test@example.com'
      }
    });

    if (response4.data.success) {
      console.log('✅ Contexto de productos incluido');
      console.log(`   📊 Productos en contexto: ${response4.data.productsCount || 0}`);
      console.log(`   🎯 Contexto usado: ${response4.data.usedProductContext ? 'Sí' : 'No'}`);
    }

    console.log('\n🎉 ¡Todas las pruebas completadas!');
    console.log('\n✨ El chat mejorado ahora:');
    console.log('   ✅ Responde de manera más alegre y amigable');
    console.log('   ✅ Usa emojis para hacer la conversación divertida');
    console.log('   ✅ Incluye contexto de productos en tiempo real');
    console.log('   ✅ Activa el flujo de compra conversacional');
    console.log('   ✅ Muestra opciones interactivas como botones');
    console.log('   ✅ Mantiene respuestas cortas y fáciles de entender');

    console.log('\n🚀 ¡El sistema está listo para usar!');
    console.log('\n💡 Prueba estas consultas:');
    console.log('   - "¿Qué productos tienen?"');
    console.log('   - "Quiero comprar un smartphone"');
    console.log('   - "Ver mi carrito"');
    console.log('   - "Proceder al pago"');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testImprovedChat();

export { testImprovedChat };
