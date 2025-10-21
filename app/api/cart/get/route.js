import connectDB from "@/config/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetCartUseCase } from '@/src/application/use-cases/cartUseCases'
import { UserRepositoryImpl } from '@/src/infrastructure/database/repositories'


export async function GET(request) {
    try {

        const { userId } = getAuth(request)

        if (!userId) {
            return NextResponse.json({ success: false, message: 'Usuario no autenticado' })
        }

        await connectDB()

        // Usar caso de uso con UserRepository
        const userRepository = new UserRepositoryImpl()
        const getCartUseCase = new GetCartUseCase(userRepository)
        const result = await getCartUseCase.execute(userId)

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        return NextResponse.json({ success: true, cartItems: result.cartItems})

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}