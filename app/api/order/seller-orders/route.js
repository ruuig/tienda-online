import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetSellerOrdersUseCase } from '@/src/application/use-cases/orderUseCases'
import { OrderRepositoryImpl } from '@/src/infrastructure/database/repositories'

export async function GET(request) {
    try {

        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' })
        }

        await connectDB()

        // Usar caso de uso
        const orderRepository = new OrderRepositoryImpl()
        const getSellerOrdersUseCase = new GetSellerOrdersUseCase(orderRepository)
        const result = await getSellerOrdersUseCase.execute()

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        return NextResponse.json({ success: true, orders: result.orders })

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}