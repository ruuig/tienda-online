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

export async function PUT(request) {
    try {
        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'No autorizado' })
        }

        const formData = await request.formData()

        const productId = formData.get('productId');
        const name = formData.get('name');
        const description = formData.get('description');
        const category = formData.get('category');
        const price = formData.get('price');
        const offerPrice = formData.get('offerPrice');
        const existingImagesStr = formData.get('existingImages');
        const existingImages = existingImagesStr ? JSON.parse(existingImagesStr) : [];

        const newFiles = formData.getAll('images');

        await connectDB()

        // Buscar el producto
        const product = await Product.findById(productId)

        if (!product) {
            return NextResponse.json({ success: false, message: 'Producto no encontrado' })
        }

        // Verificar que el producto pertenece al vendedor O que el usuario es administrador
        if (product.userId !== userId && !isSeller) {
            return NextResponse.json({ success: false, message: 'No tienes permiso para editar este producto' })
        }

        // Subir nuevas imágenes si hay
        let newImageUrls = []
        if (newFiles && newFiles.length > 0 && newFiles[0].size > 0) {
            const result = await Promise.all(
                newFiles.map(async (file) => {
                    const arrayBuffer = await file.arrayBuffer()
                    const buffer = Buffer.from(arrayBuffer)

                    return new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            { resource_type: 'auto' },
                            (error, result) => {
                                if (error) {
                                    reject(error)
                                } else {
                                    resolve(result)
                                }
                            }
                        )
                        stream.end(buffer)
                    })
                })
            )
            newImageUrls = result.map(result => result.secure_url)
        }

        // Combinar imágenes existentes con nuevas
        const allImages = [...existingImages, ...newImageUrls]

        // Actualizar el producto
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                name,
                description,
                category,
                price: Number(price),
                offerPrice: Number(offerPrice),
                image: allImages
            },
            { new: true }
        )

        return NextResponse.json({ success: true, message: 'Producto actualizado correctamente', product: updatedProduct })

    } catch (error) {
        console.error('Error al actualizar producto:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}
