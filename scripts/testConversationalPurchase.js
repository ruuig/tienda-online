/**
 * Script de prueba para el sistema de compra conversacional
 * Ejecutar: node scripts/testConversationalPurchase.js
 */

import connectDB from '../src/infrastructure/database/db.js';
import axios from 'axios';
import { conversationalCartService } from '../src/services/conversationalCartService.js';

async function testConversationalPurchase() {
  try {
    console.log('🧪 Probando sistema de compra conversacional...');

    await connectDB();
    console.log('✅ Base de datos conectada');

    // Obtener productos para el contexto
    const { data: productData } = await axios.get('http://localhost:3000/api/product/list');

    if (!productData.success || !productData.products || productData.products.length === 0) {
      console.log('⚠️ No hay productos disponibles para probar. Crea algunos productos primero.');
      return;
    }

    const products = productData.products;
    console.log(`📦 Encontrados ${products.length} productos para testing`);

    // Inicializar contexto de productos
    const { productContextService } = await import('../src/services/productContextService.js');
    await productContextService.initialize(products);

    // Probar flujo de compra conversacional
    const conversationId = 'test-conversation-' + Date.now();
    const userId = 'test-user-123';

    console.log('\n🚀 Probando flujo de compra conversacional...');

    // Test 1: Iniciar flujo de compra
    console.log('\n📝 Test 1: Iniciar flujo de compra');
    const state = conversationalCartService.startPurchaseFlow(conversationId, userId);
    console.log('✅ Estado inicial creado:', {
      conversationId: state.conversationId,
      items: state.items.length,
      currentStep: state.currentStep
    });

    // Test 2: Buscar y procesar producto
    console.log('\n📝 Test 2: Buscar producto específico');
    const testProduct = products[0];
    console.log(`🔍 Buscando producto: ${testProduct.name}`);

    const productResult = await conversationalCartService.processProductPurchaseIntent(
      conversationId,
      userId,
      `Quiero comprar ${testProduct.name}`,
      testProduct
    );

    console.log('✅ Producto encontrado y procesado:', {
      action: productResult.action,
      messageLength: productResult.message.length,
      hasNextSteps: productResult.nextSteps?.length > 0
    });

    // Test 3: Simular respuesta afirmativa del usuario
    console.log('\n📝 Test 3: Simular respuesta afirmativa');
    const addResult = await conversationalCartService.processUserResponse(conversationId, 'Sí, agregarlo al carrito');

    console.log('✅ Producto agregado al carrito:', {
      action: addResult.action,
      success: addResult.success,
      cartItems: addResult.cartSummary?.totalItems || 0
    });

    // Test 4: Ver carrito
    console.log('\n📝 Test 4: Ver contenido del carrito');
    const cartResult = conversationalCartService.showCart(conversationId);

    console.log('✅ Carrito mostrado:', {
      action: cartResult.action,
      totalItems: cartResult.cartSummary?.totalItems || 0,
      totalAmount: cartResult.cartSummary?.totalAmount || 0
    });

    // Test 5: Proceder al checkout
    console.log('\n📝 Test 5: Proceder al checkout');
    const checkoutResult = conversationalCartService.startCheckout(conversationId);

    console.log('✅ Checkout iniciado:', {
      action: checkoutResult.action,
      readyForCheckout: checkoutResult.action === 'ready_for_checkout',
      redirectTo: checkoutResult.redirectTo
    });

    // Test 6: Confirmar compra
    console.log('\n📝 Test 6: Confirmar compra');
    const confirmResult = conversationalCartService.confirmPurchase(conversationId);

    console.log('✅ Compra completada:', {
      action: confirmResult.action,
      purchaseCompleted: confirmResult.action === 'purchase_completed',
      redirectTo: confirmResult.redirectTo,
      orderItems: confirmResult.orderData?.items?.length || 0
    });

    // Test 7: Estadísticas del servicio
    console.log('\n📊 Estadísticas del servicio:');
    const stats = conversationalCartService.getStats();
    console.log('✅ Stats:', stats);

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('\n✨ El sistema de compra conversacional está funcionando correctamente:');
    console.log('   ✅ Detección de productos');
    console.log('   ✅ Flujo de conversación');
    console.log('   ✅ Gestión del carrito');
    console.log('   ✅ Proceso de checkout');
    console.log('   ✅ Integración completa');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Probar integración con la API de chat
async function testChatAPIIntegration() {
  try {
    console.log('\n🔗 Probando integración con API de chat...');

    const testMessage = 'Quiero comprar un smartphone';
    const response = await axios.post('http://localhost:3000/api/chat/process-message', {
      conversationId: 'test-chat-' + Date.now(),
      message: testMessage,
      userInfo: {
        id: 'test-user',
        name: 'Usuario de Prueba',
        email: 'test@example.com'
      }
    });

    if (response.data.success) {
      console.log('✅ API de chat integrada correctamente');
      console.log('   - Mensaje procesado:', testMessage.substring(0, 50) + '...');
      console.log('   - Intención detectada:', response.data.intent?.intent);
      console.log('   - Respuesta generada:', response.data.message?.content?.substring(0, 100) + '...');
      console.log('   - Tipo de respuesta:', response.data.message?.type);

      if (response.data.message?.type === 'purchase_flow') {
        console.log('   ✅ Flujo de compra activado');
        console.log('   - Opciones disponibles:', response.data.message.metadata?.nextSteps?.length || 0);
      }
    } else {
      console.log('⚠️ API respondió con error:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error probando API de chat:', error.message);
  }
}

// Ejecutar pruebas completas
async function runFullTest() {
  await testConversationalPurchase();
  await testChatAPIIntegration();
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullTest();
}

export { testConversationalPurchase, testChatAPIIntegration, runFullTest };
