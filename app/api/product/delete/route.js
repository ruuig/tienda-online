import { v2 as cloudinary } from "cloudinary";
import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/src/domain/entities/Product";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function DELETE(request) {
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
            return NextResponse.json({ success: false, message: 'No tienes permiso para eliminar este producto' })
        }

        // Eliminar las imágenes de Cloudinary
        if (product.image && product.image.length > 0) {
            await Promise.all(
                product.image.map(async (imageUrl) => {
                    try {
                        // Extraer el public_id de la URL de Cloudinary
                        const publicId = imageUrl.split('/').pop().split('.')[0]
                        await cloudinary.uploader.destroy(publicId)
                    } catch (error) {
                        console.error('Error al eliminar imagen de Cloudinary:', error)
                    }
                })
            )
        }

        // Eliminar el producto de la base de datos
        await Product.findByIdAndDelete(productId)

        return NextResponse.json({ success: true, message: 'Producto eliminado correctamente' })

    } catch (error) {
        console.error('Error al eliminar producto:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}
