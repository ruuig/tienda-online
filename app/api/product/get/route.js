import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { GetProductByIdUseCase } from '@/src/application/use-cases/productUseCases'
import { ProductRepositoryImpl } from '@/src/infrastructure/database/repositories'

export async function GET(request) {
    try {
        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'No autorizado' })
        }

        // Obtener el ID del producto desde la URL con manejo de errores
        let url, productId
        try {
            url = new URL(request.url)
            productId = url.searchParams.get('id')
        } catch (urlError) {
            console.error('Error parsing URL:', urlError)
            return NextResponse.json({ success: false, message: 'URL inválida' })
        }

        if (!productId) {
            return NextResponse.json({ success: false, message: 'ID del producto no proporcionado' })
        }

        await connectDB()

        // Usar caso de uso
        const productRepository = new ProductRepositoryImpl()
        const getProductByIdUseCase = new GetProductByIdUseCase(productRepository)
        const result = await getProductByIdUseCase.execute(productId)

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        // Verificar permisos (esta lógica podría estar en el caso de uso también)
        if (result.product.userId !== userId && !isSeller) {
            return NextResponse.json({ success: false, message: 'No tienes permiso para ver este producto' })
        }

        return NextResponse.json({ success: true, product: result.product })

    } catch (error) {
        console.error('Error al obtener producto:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}
