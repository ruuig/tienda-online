import { NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

export async function POST(request, { params }) {
  try {
    console.log("🔍 API: Iniciando cambio de rol");

    const { userId: actorId } = getAuth(request);
    if (!actorId) {
      console.log("❌ API: No autorizado - sin userId");
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 });
    }
    console.log("✅ API: Usuario autenticado:", actorId);

    const body = await request.json();
    const { role } = body;
    console.log("📝 API: Rol solicitado:", role);

    // Obtener el userId del parámetro dinámico
    const resolvedParams = await params;
    const targetUserId = resolvedParams.userId;
    console.log("🎯 API: Usuario objetivo:", targetUserId);

    // Solo permite asignar roles "user" y "seller" (no se pueden crear admins desde la interfaz por seguridad)
    if (!["user", "seller"].includes(role)) {
      console.log("❌ API: Rol inválido:", role);
      return NextResponse.json({ success: false, message: "Rol inválido" }, { status: 400 });
    }

    // Verifica que quien ejecuta sea ADMIN o SELLER (solo estos roles pueden gestionar usuarios)
    const clerk = await clerkClient();
    const actor = await clerk.users.getUser(actorId);
    const actorRole = actor.publicMetadata?.role || "user";
    console.log("👤 API: Rol del actor:", actorRole);

    if (actorRole !== "admin" && actorRole !== "seller") {
      console.log("❌ API: Permisos insuficientes");
      return NextResponse.json({ success: false, message: "Solo administradores y vendedores pueden cambiar roles de usuarios" }, { status: 403 });
    }

    // Si se está cambiando el rol de otro usuario, verificar permisos adicionales
    if (targetUserId !== actorId && (actorRole !== "admin" && actorRole !== "seller")) {
      console.log("❌ API: Intento de cambiar rol de otro usuario sin permisos admin/seller");
      return NextResponse.json({ success: false, message: "Solo los administradores y vendedores pueden cambiar roles de otros usuarios" }, { status: 403 });
    }

    // Actualiza el rol del usuario objetivo en publicMetadata
    console.log("🔄 API: Actualizando metadata de Clerk");
    await clerk.users.updateUserMetadata(targetUserId, {
      publicMetadata: { role }
    });

    console.log("✅ API: Rol actualizado exitosamente");
    return NextResponse.json({
      success: true,
      message: `Rol asignado: ${role}`,
      userId: targetUserId,
      note: 'Los roles de administrador solo se pueden asignar desde el dashboard de Clerk por seguridad. Para cambiar el rol en producción, ve al dashboard de Clerk y actualiza publicMetadata.role'
    });
  } catch (error) {
    console.error("❌ API: Error asignando rol:", error);
    return NextResponse.json({
      success: false,
      message: `Error interno del servidor: ${error.message}`,
      error: error.toString()
    }, { status: 500 });
  }
}
