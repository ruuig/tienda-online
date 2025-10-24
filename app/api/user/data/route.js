import connectDB from "@/src/infrastructure/database/db";
import User from "@/src/domain/entities/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";


export async function GET(request) {

    try {
        const { userId } = getAuth(request)

        if (!userId) {
            return NextResponse.json({ success: false, message: "Usuario no autenticado" })
        }

        await connectDB()

        // Buscar usuario existente
        let user = await User.findById(userId)

        // Si el usuario no existe en MongoDB, crearlo automáticamente
        if (!user) {
            console.log('Usuario no encontrado en MongoDB, creando automáticamente:', userId)

            try {
                // Obtener información del usuario de Clerk
                const clerkUser = await currentUser()

                if (!clerkUser) {
                    return NextResponse.json({ success: false, message: "Usuario no encontrado en Clerk" })
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
                console.log('Usuario creado automáticamente en MongoDB:', userId)

            } catch (createError) {
                console.error('Error creando usuario automáticamente:', createError)
                return NextResponse.json({ success: false, message: "Error creando usuario" })
            }
        }

        return NextResponse.json({success:true, user})

    } catch (error) {
        console.error('Error en API de datos de usuario:', error)
        return NextResponse.json({ success: false, message: error.message })
    }

}
