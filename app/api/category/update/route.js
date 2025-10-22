import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { UpdateCategoryUseCase } from '@/src/application/use-cases/categoryUseCases'
import { CategoryRepositoryImpl } from '@/src/infrastructure/database/repositories'

export async function PUT(request) {
    try {
        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'No autorizado' })
        }

        const body = await request.json()
        const { id, name, description, isActive } = body

        if (!id) {
            return NextResponse.json({ success: false, message: 'El ID de la categoría es requerido' })
        }

        await connectDB()

        // Usar caso de uso
        const categoryRepository = new CategoryRepositoryImpl()
        const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepository)
        const result = await updateCategoryUseCase.execute(id, {
            name: name ? name.trim() : undefined,
            description: description ? description.trim() : undefined,
            isActive
        }, userId)

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        return NextResponse.json({ success: true, message: 'Categoría actualizada correctamente', category: result.category })

    } catch (error) {
        console.error('Error al actualizar categoría:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}
