import connectDB from '@/config/db'
import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { UpdateCartUseCase } from '@/src/application/use-cases/cartUseCases'
import { CartRepositoryImpl } from '@/src/infrastructure/database/repositories'

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

        // Usar caso de uso
        const cartRepository = new CartRepositoryImpl()
        const updateCartUseCase = new UpdateCartUseCase(cartRepository)
        const result = await updateCartUseCase.execute(userId, cartData)

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}