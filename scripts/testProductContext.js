/**
 * Script de prueba para el contexto de productos en el chat
 * Ejecutar: node scripts/testProductContext.js
 */

import connectDB from '../src/infrastructure/database/db.js';
import axios from 'axios';

async function testProductContext() {
  try {
    console.log('🧪 Probando integración de contexto de productos en el chat...');

    await connectDB();
    console.log('✅ Base de datos conectada');

    // Obtener productos de la API
    const { data: productData } = await axios.get('http://localhost:3000/api/product/list');

    if (!productData.success) {
      throw new Error('No se pudieron obtener productos');
    }

    const products = productData.products;
    console.log(`📦 Encontrados ${products.length} productos`);

    if (products.length === 0) {
      console.log('⚠️ No hay productos para probar. Crea algunos productos primero.');
      return;
    }

    // Probar el servicio de contexto de productos
    const { productContextService } = await import('../src/services/productContextService.js');

    console.log('🚀 Inicializando contexto de productos...');
    await productContextService.initialize(products);

    const stats = productContextService.getStats();
    console.log('📊 Estadísticas del contexto:');
    console.log(`   - Productos: ${stats.productsCount}`);
    console.log(`   - Categorías: ${stats.categories.join(', ')}`);
    console.log(`   - Estado: ${stats.status}`);

    // Probar búsqueda de productos
    console.log('\n🔍 Probando búsqueda de productos...');

    const testQueries = [
      'smartphone',
      'productos económicos',
      'iPhone',
      'laptop para trabajo'
    ];

    for (const query of testQueries) {
      console.log(`\n   Consulta: "${query}"`);
      const results = await productContextService.searchProducts(query, 3);

      if (results.length > 0) {
        console.log(`   ✅ Encontrados ${results.length} productos relevantes:`);
        results.forEach((product, index) => {
          console.log(`      ${index + 1}. ${product.name} (Q${product.offerPrice}) - ${product.category}`);
        });
      } else {
        console.log('   ❌ No se encontraron productos relevantes');
      }
    }

    // Probar generación de contexto
    console.log('\n📝 Probando generación de contexto...');
    const context = await productContextService.generateContext('¿Tienen smartphones disponibles?');
    console.log('Contexto generado:');
    console.log('─'.repeat(50));
    console.log(context.substring(0, 500) + '...');
    console.log('─'.repeat(50));

    console.log('\n✅ Prueba completada exitosamente!');
    console.log('\n🎯 El chat ahora puede:');
    console.log('   - Conocer todos los productos disponibles');
    console.log('   - Responder preguntas específicas sobre productos');
    console.log('   - Sugerir productos basados en consultas');
    console.log('   - Proporcionar información de precios y categorías');
    console.log('   - Mostrar preguntas frecuentes dinámicas');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar prueba si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testProductContext();
}

export { testProductContext };
