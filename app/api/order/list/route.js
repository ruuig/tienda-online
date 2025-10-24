import connectDB from "@/config/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetOrdersUseCase } from '@/src/application/use-cases/orderUseCases'
import { OrderRepositoryImpl } from '@/src/infrastructure/database/repositories'

export async function GET(request) {
    try {

        const {userId} = getAuth(request)

        if (!userId) {
            return NextResponse.json({ success: false, message: 'Usuario no autenticado' })
        }

        await connectDB()

        // Usar caso de uso
        const orderRepository = new OrderRepositoryImpl()
        const getOrdersUseCase = new GetOrdersUseCase(orderRepository)
        const result = await getOrdersUseCase.execute(userId)

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        return NextResponse.json({ success: true, orders: result.orders })

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}