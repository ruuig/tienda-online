// app/api/rag/health/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  // Auto-detecta si MongoDB está disponible y configurado
  const hasMongoDB = !!process.env.MONGODB_URI;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  let databaseStatus = 'demo_mode';
  let counts = { documents: 0, chunks: 0, embeddings: 0 };

  // Si MongoDB está configurado, verificar conexión real
  if (hasMongoDB) {
    try {
      const mongoose = await import('mongoose');
      if (mongoose.default.connection.readyState === 1) {
        databaseStatus = 'connected';

        // Contar documentos reales si la conexión está activa
        const db = mongoose.default.connection.db;
        if (db) {
          const collections = await db.listCollections().toArray();
          const collectionNames = collections.map(col => col.name);

          if (collectionNames.includes('rag_documents')) {
            counts.documents = await db.collection('rag_documents').countDocuments();
          }
          if (collectionNames.includes('rag_document_chunks')) {
            counts.chunks = await db.collection('rag_document_chunks').countDocuments();
          }
          if (collectionNames.includes('rag_document_embeddings')) {
            counts.embeddings = await db.collection('rag_document_embeddings').countDocuments();
          }
        }
      } else {
        databaseStatus = 'configured_but_not_connected';
      }
    } catch (error) {
      databaseStatus = 'connection_error';
    }
  }

  return NextResponse.json({
    success: true,
    message: 'RAG system health check (auto-configurable)',
    status: {
      database: databaseStatus,
      openai: hasOpenAI ? 'configured' : 'not_configured',
      collections: {
        rag_documents: true,
        rag_document_chunks: true,
        rag_document_embeddings: true
      },
      counts: counts
    },
    optimizations: {
      model: 'gpt-3.5-turbo',
      embeddings: 'text-embedding-3-small',
      chunkSize: '1200 characters',
      streaming: 'enabled',
      productIntegration: 'enabled',
      autoSetup: true
    },
    endpoints: {
      health: '/api/rag/health',
      documents: '/api/rag/documents',
      chat: '/api/chat/stream',
      rebuild: '/api/chat/rag'
    },
    testCommands: {
      checkHealth: 'curl http://localhost:3001/api/rag/health',
      testChat: 'curl -X POST http://localhost:3001/api/chat/stream -H "Content-Type: application/json" -d \'{"message": "Hola, ¿qué información tienes?"}\'',
      uploadDocument: 'curl -X POST http://localhost:3001/api/rag/documents -F "file=@documento.pdf" -F "title=Mi Documento"'
    },
    timestamp: new Date().toISOString(),
    note: hasMongoDB ? 'Sistema RAG completo con MongoDB' : 'Modo demo (sin MongoDB)'
  });
}
