import connectDB from '@/src/infrastructure/database/db'
import User from '@/src/domain/entities/User'
import { NextResponse } from 'next/server'
import { clerkClient } from "@clerk/nextjs/server";

// Si quisieras validar sesión/rol con Clerk, descomenta estas líneas:
// import { getAuth } from '@clerk/nextjs/server'

export async function GET(request) {
  try {
    // --- (opcional) validar auth/rol ---
    // const { userId, sessionId } = getAuth(request)
    // if (!userId) {
    //   return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 })
    // }

    await connectDB()

    // permite query params como ?limit=50
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500)

    // selecciona campos públicos (no exponemos cartItems)
    const mongoUsers = await User.find({}, { _id: 1, name: 1, email: 1, imageUrl: 1 })
      .sort({ name: 1 })
      .limit(limit)
      .lean()
      
 // Trae usuarios de Clerk (primera página; si necesitas más, paginamos)
  const clerk = await clerkClient();
  const clerkPage = await clerk.users.getUserList({ limit: 500 });
   const roleById = new Map(
    clerkPage.data.map(u => [u.id, (u.publicMetadata?.role ?? "user")])
   );

   const users = mongoUsers.map(u => ({
     ...u,
     role: roleById.get(u._id) || "user"
   }));

    return NextResponse.json({ success: true, users })
  } catch (err) {
    console.error('Error listando usuarios:', err)
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 })
  }
}
