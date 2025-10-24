import connectDB from '@/config/db'
import { NextResponse } from 'next/server'
import { GetSellerProductsUseCase } from '@/src/application/use-cases/productUseCases'
import { ProductRepositoryImpl } from '@/src/infrastructure/database/repositories'

export async function GET(request) {
    try {
        await connectDB()
        console.log('🔍 Seller List API - Connected to DB')

        // Usar caso de uso
        const productRepository = new ProductRepositoryImpl()
        const getSellerProductsUseCase = new GetSellerProductsUseCase(productRepository)
        const result = await getSellerProductsUseCase.execute()

        if (!result.success) {
            console.error('🔍 Seller List API - Error:', result.message)
            return NextResponse.json({ success: false, message: result.message })
        }

        console.log('🔍 Seller List API - All products:', result.products.length)

        // Crear respuesta sin caché
        const response = NextResponse.json({ success: true, products: result.products })
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')

        return response

    } catch (error) {
        console.error('🔍 Seller List API - Error:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}