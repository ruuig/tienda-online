import connectDB from "@/config/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { GetUserDataUseCase, CreateUserUseCase } from '@/src/application/use-cases/userUseCases'
import { UserRepositoryImpl } from '@/src/infrastructure/database/repositories'

export async function GET(request) {
    try {
        const { userId } = getAuth(request)

        if (!userId) {
            return NextResponse.json({ success: false, message: "Usuario no autenticado" })
        }

        await connectDB()

        // Usar caso de uso para obtener datos del usuario
        const userRepository = new UserRepositoryImpl()
        const getUserDataUseCase = new GetUserDataUseCase(userRepository)
        const result = await getUserDataUseCase.execute(userId)

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message })
        }

        // Si el usuario no existe, crearlo automáticamente
        if (result.needsCreation) {
            console.log('Usuario no encontrado en MongoDB, creando automáticamente:', userId)

            try {
                // Obtener información del usuario de Clerk
                const clerkUser = await currentUser()

                if (!clerkUser) {
                    return NextResponse.json({ success: false, message: "Usuario no encontrado en Clerk" })
                }

                // Crear usuario usando caso de uso
                const createUserUseCase = new CreateUserUseCase(userRepository)
                const createResult = await createUserUseCase.execute(userId, {
                    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'Usuario',
                    email: clerkUser.emailAddresses[0]?.emailAddress || '',
                    imageUrl: clerkUser.imageUrl || ''
                })

                if (!createResult.success) {
                    return NextResponse.json({ success: false, message: createResult.message })
                }

                console.log('Usuario creado automáticamente en MongoDB:', userId)
                return NextResponse.json({ success: true, user: createResult.user })

            } catch (createError) {
                console.error('Error creando usuario automáticamente:', createError)
                return NextResponse.json({ success: false, message: "Error creando usuario" })
            }
        }

        return NextResponse.json({ success: true, user: result.user })

    } catch (error) {
        console.error('Error en API de datos de usuario:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}