import mongoose from "mongoose";

let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {

    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands:false,
            serverSelectionTimeoutMS: 10000, // 10 segundos timeout
            socketTimeoutMS: 45000, // 45 segundos socket timeout
            maxPoolSize: 10, // Máximo 10 conexiones
            minPoolSize: 2, // Mínimo 2 conexiones
            maxIdleTimeMS: 30000, // 30 segundos antes de cerrar conexiones inactivas
        }

        cached.promise = mongoose.connect(`${process.env.MONGODB_URI}/quickcart`,opts).then(async (mongoose) => {
            console.log('✅ MongoDB connected successfully')

            // 🚀 Auto-setup del sistema RAG
            await setupRAGCollections(mongoose.connection.db)
            console.log('✅ Sistema RAG auto-configurado')

            return mongoose
        }).catch(error => {
            console.error('❌ MongoDB connection error:', error)
            throw error
        })

    }

    cached.conn = await cached.promise
    return cached.conn

}

/**
 * Configura automáticamente las colecciones RAG si no existen
 */
async function setupRAGCollections(db) {
    try {
        const collections = [
            {
                name: 'rag_documents',
                indexes: [
                    { key: { ownerId: 1 }, name: 'ownerId_idx' },
                    { key: { createdAt: -1 }, name: 'createdAt_idx' },
                    { key: { title: 'text', filename: 'text' }, name: 'search_idx' }
                ]
            },
            {
                name: 'rag_document_chunks',
                indexes: [
                    { key: { documentId: 1 }, name: 'documentId_idx' },
                    { key: { chunkIndex: 1 }, name: 'chunkIndex_idx' },
                    { key: { content: 'text' }, name: 'content_search_idx' }
                ]
            },
            {
                name: 'rag_document_embeddings',
                indexes: [
                    { key: { chunkId: 1 }, unique: true, name: 'chunkId_unique' },
                    { key: { embedding: 1 }, name: 'embedding_idx' }
                ]
            }
        ];

        for (const collection of collections) {
            // Crear colección si no existe
            const existingCollections = await db.listCollections({ name: collection.name }).toArray();
            if (existingCollections.length === 0) {
                await db.createCollection(collection.name);
                console.log(`📁 Colección ${collection.name} creada automáticamente`);
            }

            // Crear índices
            for (const index of collection.indexes) {
                try {
                    await db.collection(collection.name).createIndex(index.key, {
                        name: index.name,
                        unique: index.unique || false
                    });
                    console.log(`  ✅ Índice ${index.name} creado`);
                } catch (error) {
                    if (error.code === 11000 || error.codeName === 'IndexOptionsConflict') {
                        // Índice ya existe, no es error
                    } else {
                        console.error(`  ❌ Error creando índice ${index.name}:`, error.message);
                    }
                }
            }
        }

        console.log('🎉 Sistema RAG listo y configurado automáticamente!');

    } catch (error) {
        console.warn('⚠️ No se pudo configurar automáticamente el sistema RAG:', error.message);
        console.log('💡 Puedes ejecutar "npm run rag:setup" manualmente si es necesario');
    }
}

export default connectDB