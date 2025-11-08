import connectDB from "@/config/db";
import Order from "@/src/domain/entities/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
    try {
        // Simplificar: solo verificar que hay un usuario autenticado
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ success: false, message: 'No autenticado' });
        }

        await connectDB();

        const { orderId } = params;
        const { status } = await request.json();

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' });
        }

        return NextResponse.json({ success: true, order });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
