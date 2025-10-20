import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";



export async function POST(request) {
    try {
        // Conectar a la base de datos
        await connectDB();

        const { userId } = getAuth(request)
        console.log('Order creation - userId:', userId)

        // Verificar que tenemos un userId válido
        if (!userId) {
            console.error('Order creation - No userId provided')
            return NextResponse.json({ success: false, message: 'Usuario no autenticado' });
        }

        const { address, items } = await request.json();
        console.log('Order creation - address:', address)
        console.log('Order creation - items:', items)

        if (!address || items.length === 0) {
            console.error('Order creation - Invalid data')
            return NextResponse.json({ success: false, message: 'Invalid data' });
        }

        // calculate amount using items
        let amount = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                amount += product.offerPrice * item.quantity;
            }
        }

        // Add tax (2%)
        const totalAmount = amount + Math.floor(amount * 0.02);

        // Crear y guardar la orden directamente en la base de datos
        const newOrder = new Order({
            userId,
            items,
            amount: totalAmount,
            address,
            status: 'Order Placed',
            date: Date.now()
        });

        await newOrder.save();
        console.log('Order creation - Orden guardada directamente en DB:', newOrder._id);

        // Nota: Las funciones de Inngest se pueden usar para procesamiento adicional si es necesario

        // clear user cart - verificar que el usuario existe, si no, crearlo
        if (userId) {
            console.log('Order creation - Clearing cart for user:', userId)
            let user = await User.findById(userId);

            // Si el usuario no existe, crearlo automáticamente
            if (!user) {
                console.log('Order creation - Usuario no encontrado en MongoDB, creando automáticamente:', userId)

                try {
                    // Obtener información del usuario de Clerk
                    const { currentUser } = await import("@clerk/nextjs/server");
                    const clerkUser = await currentUser();

                    if (!clerkUser) {
                        return NextResponse.json({ success: false, message: "Usuario no encontrado en Clerk" });
                    }

                    // Crear nuevo usuario en MongoDB
                    const newUser = new User({
                        _id: userId,
                        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'Usuario',
                        email: clerkUser.emailAddresses[0]?.emailAddress || '',
                        imageUrl: clerkUser.imageUrl || '',
                        cartItems: {}
                    })

                    user = await newUser.save()
                    console.log('Order creation - Usuario creado automáticamente en MongoDB:', userId)

                } catch (createError) {
                    console.error('Order creation - Error creando usuario automáticamente:', createError)
                    return NextResponse.json({ success: false, message: "Error creando usuario" })
                }
            }

            if (user) {
                console.log('Order creation - User found, clearing cartItems')
                user.cartItems = {};
                await user.save();
                console.log('Order creation - Cart cleared successfully')
            }
        }

        console.log('Order creation - Order placed successfully')
        return NextResponse.json({ success: true, message: 'Order Placed' })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, message: error.message })
    }
}