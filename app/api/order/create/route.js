import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { CreateOrderUseCase } from '@/src/application/use-cases/orderUseCases'
import { OrderRepositoryImpl, UserRepositoryImpl, ProductRepositoryImpl } from '@/src/infrastructure/database/repositories'

export async function POST(request) {
    try {
        await connectDB();

        const { userId } = getAuth(request)
        console.log('Order creation - userId:', userId)

        if (!userId) {
            console.error('Order creation - No userId provided')
            return NextResponse.json({ success: false, message: 'Usuario no autenticado' });
        }

        const { address, items, discountId, discountAmount } = await request.json();
        console.log('Order creation - address:', address)
        console.log('Order creation - items:', items)
        console.log('Order creation - discountId:', discountId)
        console.log('Order creation - discountAmount:', discountAmount)

        // Usar caso de uso
        const orderRepository = new OrderRepositoryImpl()
        const userRepository = new UserRepositoryImpl()
        const productRepository = new ProductRepositoryImpl()
        const createOrderUseCase = new CreateOrderUseCase(orderRepository, userRepository, productRepository)

        const result = await createOrderUseCase.execute(userId, address, items, discountId, discountAmount)

        if (!result.success) {
            console.error('Order creation - Error:', result.message)
            return NextResponse.json({ success: false, message: result.message });
        }

        console.log('Order creation - Order placed successfully')
        return NextResponse.json({ success: true, message: 'Order Placed' })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, message: error.message })
    }
}