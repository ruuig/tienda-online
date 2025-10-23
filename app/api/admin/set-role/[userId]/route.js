import { NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

export async function POST(request, { params }) {
  try {
    const { userId: actorId } = getAuth(request);
    if (!actorId) {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;
    const { userId } = params;

    if (!["user", "seller"].includes(role)) {
      return NextResponse.json({ success: false, message: "Rol inválido" }, { status: 400 });
    }

    // Verifica que quien ejecuta sea ADMIN (publicMetadata.role === 'admin')
    const actor = await clerkClient.users.getUser(actorId);
    const actorRole = actor.publicMetadata?.role || "user";
    if (actorRole !== "admin") {
      return NextResponse.json({ success: false, message: "Requiere rol admin" }, { status: 403 });
    }

    // Actualiza el rol del usuario objetivo en publicMetadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role }
    });

    return NextResponse.json({ success: true, message: `Rol asignado: ${role}`, userId });
  } catch (error) {
    console.error("Error asignando rol:", error);
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 });
  }
}
