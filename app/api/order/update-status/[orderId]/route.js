import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Order from "@/src/domain/entities/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'Not authorized' });
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
