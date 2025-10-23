import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request)

        if (!userId) {
            return NextResponse.json({ success: false, message: 'No autorizado' })
        }

        const body = await request.json()
        const { role } = body

        if (!role || !['user', 'seller', 'admin'].includes(role)) {
            return NextResponse.json({ success: false, message: 'Rol inválido' })
        }

        // Nota: En producción, esto requeriría usar la API de Clerk para actualizar el usuario
        // Por ahora solo devolvemos información sobre cómo hacerlo

        return NextResponse.json({
            success: true,
            message: `Rol configurado como: ${role}`,
            userId: userId,
            role: role,
            note: 'Para cambiar el rol en producción, ve al dashboard de Clerk y actualiza publicMetadata.role'
        })

    } catch (error) {
        console.error('Error configurando rol:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}