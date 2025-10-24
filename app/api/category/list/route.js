import connectDB from '@/config/db'
import { GetCategoriesUseCase } from '@/src/application/use-cases/categoryUseCases'
import { CategoryRepositoryImpl } from '@/src/infrastructure/database/repositories'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        await connectDB()

        // Usar caso de uso
        const categoryRepository = new CategoryRepositoryImpl()
        const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository)
        const result = await getCategoriesUseCase.execute()

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        // Crear respuesta sin caché
        const response = NextResponse.json({ success: true, categories: result.categories })
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')

        return response

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}
