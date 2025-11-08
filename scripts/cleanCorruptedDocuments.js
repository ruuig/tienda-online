// Script para limpiar documentos corruptos y recrear embeddings
// Ejecutar: node scripts/cleanCorruptedDocuments.js

// Script para limpiar documentos corruptos y recrear embeddings
// Ejecutar: node scripts/cleanCorruptedDocuments.js

async function cleanCorruptedDocuments() {
  console.log('🧹 Limpiando documentos corruptos y recreando embeddings...');

  try {
    // Conectar a la base de datos usando la misma configuración que el proyecto
    const mongoose = require('mongoose');
    const dotenv = require('dotenv');

    // Cargar variables de entorno
    dotenv.config({ path: '../.env' });

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI no está configurada en .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // 1. Buscar documentos con contenido corrupto
    const documents = await db.collection('rag_documents').find({}).toArray();
    console.log(`📄 Encontrados ${documents.length} documentos`);

    const corruptedDocuments = [];
    const validDocuments = [];

    for (const doc of documents) {
      const content = doc.content || doc.contentText || '';

      // Verificar si el contenido parece corrupto (caracteres no ASCII)
      const nonAsciiChars = content.match(/[^\x20-\x7E\n]/g);
      const nonAsciiRatio = nonAsciiChars ? nonAsciiChars.length / content.length : 0;

      if (nonAsciiRatio > 0.1 || content.length < 100) {
        corruptedDocuments.push(doc);
        console.log(`❌ Documento corrupto: ${doc.title} (${content.length} chars, ${Math.round(nonAsciiRatio * 100)}% no-ASCII)`);
      } else {
        validDocuments.push(doc);
        console.log(`✅ Documento válido: ${doc.title} (${content.length} chars)`);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   - Documentos corruptos: ${corruptedDocuments.length}`);
    console.log(`   - Documentos válidos: ${validDocuments.length}`);

    if (corruptedDocuments.length > 0) {
      console.log('\n🗑️ Eliminando documentos corruptos...');

      for (const doc of corruptedDocuments) {
        // Eliminar documento y sus chunks/embeddings
        await db.collection('rag_documents').deleteOne({ _id: doc._id });
        await db.collection('rag_document_chunks').deleteMany({ documentId: doc._id.toString() });
        await db.collection('rag_document_embeddings').deleteMany({ chunkId: new RegExp(`^${doc._id.toString()}_`) });

        console.log(`   - Eliminado: ${doc.title}`);
      }
    }

    // 2. Recrear embeddings para documentos válidos
    if (validDocuments.length > 0) {
      console.log('\n🔄 Recreando embeddings para documentos válidos...');

      const { DocumentRepositoryImpl } = require('../src/infrastructure/database/repositories');
      const { RAGService } = require('../src/infrastructure/rag/ragService');

      const documentRepository = new DocumentRepositoryImpl();
      const ragService = new RAGService(documentRepository);

      await ragService.rebuildIndex();
      console.log('✅ Índice RAG recreado exitosamente');
    }

    // 3. Mostrar estadísticas finales
    const finalStats = {
      documents: await db.collection('rag_documents').countDocuments(),
      chunks: await db.collection('rag_document_chunks').countDocuments(),
      embeddings: await db.collection('rag_document_embeddings').countDocuments()
    };

    console.log('\n📈 Estadísticas finales:');
    console.log(`   - Documentos: ${finalStats.documents}`);
    console.log(`   - Chunks: ${finalStats.chunks}`);
    console.log(`   - Embeddings: ${finalStats.embeddings}`);

    await mongoose.disconnect();
    console.log('\n✅ Limpieza completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanCorruptedDocuments();
}

module.exports = { cleanCorruptedDocuments };
