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

        cached.promise = mongoose.connect(`${process.env.MONGODB_URI}/quickcart`,opts).then( mongoose => {
            console.log('✅ MongoDB connected successfully')
            return mongoose
        }).catch(error => {
            console.error('❌ MongoDB connection error:', error)
            throw error
        })

    } 

    cached.conn = await cached.promise
    return cached.conn

}

export default connectDB