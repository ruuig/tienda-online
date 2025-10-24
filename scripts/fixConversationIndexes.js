import connectDB from '@/config/db';
import { Conversation } from '@/src/infrastructure/database/models/index.js';

export async function fixConversationIndexes() {
  try {
    await connectDB();
    console.log('🛠️ Arreglando índices de Conversation...');

    // Obtener información sobre los índices actuales
    const indexes = await Conversation.collection.getIndexes();
    console.log('Índices actuales:', Object.keys(indexes));

    // Verificar si existe el índice único de sessionId
    if (indexes.sessionId_1) {
      console.log('❌ Encontrado índice único en sessionId, eliminándolo...');
      await Conversation.collection.dropIndex('sessionId_1');
      console.log('✅ Índice único eliminado');
    }

    // Crear índice compuesto para sessionId + vendorId
    console.log('🔧 Creando índice compuesto sessionId + vendorId...');
    await Conversation.collection.createIndex(
      { sessionId: 1, vendorId: 1 },
      {
        name: 'sessionId_vendorId_compound',
        background: true
      }
    );
    console.log('✅ Índice compuesto creado');

    // Verificar índices finales
    const finalIndexes = await Conversation.collection.getIndexes();
    console.log('✅ Índices finales:', Object.keys(finalIndexes));

    console.log('🎉 Índices arreglados exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error arreglando índices:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixConversationIndexes();
}
