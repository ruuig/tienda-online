import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { ToggleCategoryStatusUseCase } from '@/src/application/use-cases/categoryUseCases'
import { CategoryRepositoryImpl } from '@/src/infrastructure/database/repositories'

export async function PUT(request) {
    try {
        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'No autorizado' })
        }

        // Obtener el ID de la categoría desde la URL
        let url, categoryId
        try {
            url = new URL(request.url)
            categoryId = url.searchParams.get('id')
        } catch (urlError) {
            console.error('Error parsing URL:', urlError)
            return NextResponse.json({ success: false, message: 'URL inválida' })
        }

        if (!categoryId) {
            return NextResponse.json({ success: false, message: 'ID de la categoría no proporcionado' })
        }

        await connectDB()

        // Usar caso de uso
        const categoryRepository = new CategoryRepositoryImpl()
        const toggleCategoryStatusUseCase = new ToggleCategoryStatusUseCase(categoryRepository)
        const result = await toggleCategoryStatusUseCase.execute(categoryId, userId)

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            category: result.category
        })

    } catch (error) {
        console.error('Error al cambiar estado de categoría:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}
