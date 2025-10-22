import connectDB from '@/config/db'
import authSeller from '@/lib/authSeller'
import Product from '@/models/Product'
import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        
        const { userId } = getAuth(request)
        console.log('🔍 Seller List API - userId:', userId)

        const isSeller = await authSeller(userId)
        console.log('🔍 Seller List API - isSeller:', isSeller)

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' });
        }

        await connectDB()
        console.log('🔍 Seller List API - Connected to DB')

        // Como administrador, puede ver TODOS los productos
        const products = await Product.find({}).sort({ date: -1 })
        console.log('🔍 Seller List API - All products for admin:', products.length)

        // Crear respuesta sin caché
        const response = NextResponse.json({ success: true, products })
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        
        return response

    } catch (error) {
        console.error('🔍 Seller List API - Error:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}