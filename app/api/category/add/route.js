import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { CreateCategoryUseCase } from '@/src/application/use-cases/categoryUseCases'
import { CategoryRepositoryImpl } from '@/src/infrastructure/database/repositories'

export async function POST(request) {
    try {
        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' })
        }

        const body = await request.json()
        const { name, description } = body

        if (!name || name.trim() === '') {
            return NextResponse.json({ success: false, message: 'El nombre de la categoría es requerido' })
        }

        await connectDB()

        // Usar caso de uso
        const categoryRepository = new CategoryRepositoryImpl()
        const createCategoryUseCase = new CreateCategoryUseCase(categoryRepository)
        const result = await createCategoryUseCase.execute(userId, {
            name: name.trim(),
            description: description ? description.trim() : ''
        })

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        return NextResponse.json({ success: true, message: 'Categoría creada exitosamente', category: result.category })

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}
