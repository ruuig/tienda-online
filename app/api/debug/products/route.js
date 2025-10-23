import connectDB from '@/config/db'
import { Product } from '@/src/domain/entities'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        await connectDB()

        // Obtener todos los productos
        const products = await Product.find({}).sort({ date: -1 })

        // Analizar categorías existentes
        const existingCategories = [...new Set(products.map(p => p.category).filter(Boolean))]
        const categoryCounts = {}
        products.forEach(product => {
            categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1
        })

        const debugInfo = {
            totalProducts: products.length,
            existingCategories: existingCategories,
            categoryCounts: categoryCounts,
            sampleProducts: products.slice(0, 10).map(p => ({
                name: p.name,
                category: p.category,
                price: p.offerPrice,
                date: p.date
            }))
        }

        return NextResponse.json({
            success: true,
            debug: debugInfo,
            message: 'Productos existentes analizados'
        })

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message
        })
    }
}
