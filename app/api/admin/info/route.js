import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from "next/server";
import connectDB from "@/config/db";

export async function POST(request) {
    try {
        const { userId } = getAuth(request)

        if (!userId) {
            return NextResponse.json({ success: false, message: 'No autorizado' })
        }

        await connectDB()

        // Aquí podrías actualizar la base de datos si es necesario
        // Por ahora solo devolvemos información sobre el usuario

        return NextResponse.json({
            success: true,
            message: 'Información del usuario obtenida',
            userId: userId,
            note: 'Para configurar el rol de admin, ve al dashboard de Clerk y establece publicMetadata.role como "admin" o "seller"'
        })

    } catch (error) {
        console.error('Error en admin info:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}
