import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { DeleteCategoryUseCase } from '@/src/application/use-cases/categoryUseCases'
import { CategoryRepositoryImpl } from '@/src/infrastructure/database/repositories'

export async function DELETE(request) {
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
        const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepository)
        const result = await deleteCategoryUseCase.execute(categoryId, userId)

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        return NextResponse.json({ success: true, message: result.message })

    } catch (error) {
        console.error('Error al eliminar categoría:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}
