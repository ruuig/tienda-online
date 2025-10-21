import connectDB from "@/config/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetCartUseCase } from '@/src/application/use-cases/cartUseCases'
import { CartRepositoryImpl } from '@/src/infrastructure/database/repositories'


export async function GET(request) {
    try {

        const { userId } = getAuth(request)

        if (!userId) {
            return NextResponse.json({ success: false, message: 'Usuario no autenticado' })
        }

        await connectDB()

        // Usar caso de uso
        const cartRepository = new CartRepositoryImpl()
        const getCartUseCase = new GetCartUseCase(cartRepository)
        const result = await getCartUseCase.execute(userId)

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        return NextResponse.json({ success: true, cartItems: result.cartItems})

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}