import { v2 as cloudinary } from "cloudinary";
import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { CreateProductUseCase } from '@/src/application/use-cases/productUseCases'
import { ProductRepositoryImpl } from '@/src/infrastructure/database/repositories'

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request) {
    try {

        const { userId } = getAuth(request)

        const formData = await request.formData()

        const name = formData.get('name');
        const description = formData.get('description');
        const category = formData.get('category');
        const price = formData.get('price');
        const offerPrice = formData.get('offerPrice');

        const files = formData.getAll('images');

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: 'no files uploaded' })
        }

        // Subir imágenes a Cloudinary
        const result = await Promise.all(
            files.map(async (file) => {
                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                return new Promise((resolve,reject)=>{
                    const stream = cloudinary.uploader.upload_stream(
                        {resource_type: 'auto'},
                        (error,result) => {
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

        const imageUrls = result.map(result => result.secure_url)

        await connectDB()

        // Usar caso de uso
        const productRepository = new ProductRepositoryImpl()
        const createProductUseCase = new CreateProductUseCase(productRepository)
        const resultUseCase = await createProductUseCase.execute(userId, {
            name,
            description,
            category,
            price: Number(price),
            offerPrice: Number(offerPrice)
        }, imageUrls)

        if (!resultUseCase.success) {
            return NextResponse.json({ success: false, message: resultUseCase.message })
        }

        return NextResponse.json({ success: true, message: 'Upload successful', newProduct: resultUseCase.product })

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}