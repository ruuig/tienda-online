import connectDB from '@/config/db'
import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { UpdateCartUseCase } from '@/src/application/use-cases/cartUseCases'
import { UserRepositoryImpl } from '@/src/infrastructure/database/repositories'

export async function POST(request) {
    try {

        const { userId } = getAuth(request)

        if (!userId) {
            return NextResponse.json({ success: false, message: 'Usuario no autenticado' })
        }

        const { cartData } = await request.json()

        if (!cartData) {
            return NextResponse.json({ success: false, message: 'Datos de carrito inválidos' })
        }

        await connectDB()

        // Usar caso de uso con UserRepository
        const userRepository = new UserRepositoryImpl()
        const updateCartUseCase = new UpdateCartUseCase(userRepository)
        const result = await updateCartUseCase.execute(userId, cartData)

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}