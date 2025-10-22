import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { initializeDefaultCategories } from '@/src/utils/initializeCategories'

export async function POST(request) {
    try {
        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'No autorizado' })
        }

        await connectDB()

        // Inicializar categorías por defecto
        await initializeDefaultCategories(userId)

        return NextResponse.json({
            success: true,
            message: 'Categorías inicializadas correctamente'
        })

    } catch (error) {
        console.error('Error inicializando categorías:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}
