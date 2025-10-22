import connectDB from '@/config/db'
import Product from '@/models/Product'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {

        await connectDB()

        // Obtener productos ordenados por fecha (más recientes primero)
        const products = await Product.find({}).sort({ date: -1 })
        
        // Crear respuesta sin caché
        const response = NextResponse.json({ success: true, products })
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        
        return response

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}