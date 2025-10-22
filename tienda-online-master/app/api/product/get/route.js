import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

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

        // Buscar el producto
        const product = await Product.findById(productId)

        if (!product) {
            return NextResponse.json({ success: false, message: 'Producto no encontrado' })
        }

        // Verificar que el producto pertenece al vendedor O que el usuario es administrador
        if (product.userId !== userId && !isSeller) {
            return NextResponse.json({ success: false, message: 'No tienes permiso para ver este producto' })
        }

        return NextResponse.json({ success: true, product })

    } catch (error) {
        console.error('Error al obtener producto:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}
