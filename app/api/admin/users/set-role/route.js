import { NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    const { userId: actorId } = getAuth(request);
    if (!actorId) {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    // Solo permite asignar roles "user" y "seller" (no se pueden crear admins desde la interfaz por seguridad)
    if (!["user", "seller"].includes(role)) {
      return NextResponse.json({ success: false, message: "Rol inválido" }, { status: 400 });
    }

    // Verifica que quien ejecuta sea ADMIN o SELLER (solo estos roles pueden gestionar usuarios)
    const clerk = await clerkClient();
    const actor = await clerk.users.getUser(actorId);
    const actorRole = actor.publicMetadata?.role || "user";
    if (actorRole !== "admin" && actorRole !== "seller") {
      return NextResponse.json({ success: false, message: "Solo administradores y vendedores pueden cambiar roles de usuarios" }, { status: 403 });
    }

    // Actualiza el rol del propio usuario en publicMetadata
    await clerk.users.updateUserMetadata(actorId, {
      publicMetadata: { role }
    });

    return NextResponse.json({
      success: true,
      message: `Rol configurado como: ${role}`,
      userId: actorId,
      role: role
    });
  } catch (error) {
    console.error("Error configurando rol:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
