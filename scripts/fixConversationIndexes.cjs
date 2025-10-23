const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixConversationIndexes() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickcart';

  try {
    console.log('🛠️ Conectando a MongoDB...');
    const client = new MongoClient(mongoUri);
    await client.connect();

    const db = client.db();
    const collection = db.collection('conversations');

    console.log('📊 Analizando índices actuales...');
    const indexes = await collection.indexes();
    console.log('Índices actuales:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.unique) console.log('    🔒 ÚNICO');
    });

    // Eliminar índice único de sessionId si existe
    const sessionIdIndex = indexes.find(idx => idx.name === 'sessionId_1');
    if (sessionIdIndex && sessionIdIndex.unique) {
      console.log('❌ Eliminando índice único de sessionId...');
      await collection.dropIndex('sessionId_1');
      console.log('✅ Índice único eliminado');
    }

    // Crear índice compuesto sessionId + vendorId
    console.log('🔧 Creando índice compuesto...');
    await collection.createIndex(
      { sessionId: 1, vendorId: 1 },
      { name: 'sessionId_vendorId_compound' }
    );
    console.log('✅ Índice compuesto creado');

    // Verificar índices finales
    console.log('📊 Índices finales:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.unique) console.log('    🔒 ÚNICO');
    });

    await client.close();
    console.log('🎉 Índices arreglados exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixConversationIndexes();
