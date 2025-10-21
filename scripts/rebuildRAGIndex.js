// Script para limpiar y reconstruir el índice RAG
// Ejecutar: node scripts/rebuildRAGIndex.js

import connectDB from '../src/infrastructure/database/db.js';
import { Document } from '../src/infrastructure/database/models/index.js';
import { RAGService } from '../src/infrastructure/rag/ragService.js';

async function rebuildRAGIndex() {
  try {
    console.log('🔄 Reconstruyendo índice RAG...');

    await connectDB();

    // Obtener documentos activos
    const documents = await Document.find({ isActive: true });

    if (documents.length === 0) {
      console.log('⚠️ No hay documentos activos para indexar');
      return;
    }

    console.log(`📚 Procesando ${documents.length} documentos...`);

    // Crear servicio RAG
    const documentRepository = {
      findAll: async (filters) => {
        if (filters?.isActive) {
          return await Document.find({ isActive: true });
        }
        return await Document.find({});
      }
    };

    const ragService = new RAGService(documentRepository);

    // Construir índice
    await ragService.buildIndex(documents);

    const stats = ragService.getStats();

    console.log('✅ Índice RAG reconstruido exitosamente!');
    console.log(`📊 Estadísticas:`);
    console.log(`   - Documentos procesados: ${stats.totalDocuments}`);
    console.log(`   - Chunks indexados: ${stats.indexedChunks}`);
    console.log(`   - Tamaño del índice: ${stats.memoryUsage}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error reconstruyendo índice RAG:', error);
    process.exit(1);
  }
}

// Ejecutar reconstrucción
rebuildRAGIndex();
