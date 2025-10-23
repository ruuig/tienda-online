// Función auxiliar para obtener usuario autenticado desde Clerk
import { auth } from '@clerk/nextjs/server';

export async function getAuthUser(request) {
  try {
    // La función auth() obtiene automáticamente la información del usuario autenticado
    // desde la sesión de Clerk, no necesita token manual
    const { userId, user } = await auth();

    if (!userId || !user) {
      return null;
    }

    return {
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.primaryEmailAddress?.emailAddress,
      imageUrl: user.imageUrl,
      isAdmin: user.publicMetadata?.role === 'admin' || user.publicMetadata?.role === 'seller',
      role: user.publicMetadata?.role || 'user',
      vendorId: user.publicMetadata?.vendorId || process.env.DEFAULT_VENDOR_ID || 'default_vendor'
    };
  } catch (error) {
    console.error('Error al obtener usuario autenticado:', error);
    return null;
  }
}

// Función para verificar si el usuario es administrador
export async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return { user: null, authorized: false, message: 'No autorizado' };
  }

  if (!user.isAdmin) {
    return { user, authorized: false, message: 'Se requieren permisos de administrador' };
  }

  return { user, authorized: true, message: 'Autorizado' };
}

export async function requireSeller(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return { user: null, authorized: false, message: 'No autorizado' };
  }

  const role = user.role;
  if (role !== 'admin' && role !== 'seller') {
    return { user, authorized: false, message: 'Se requieren permisos de vendedor' };
  }

  return { user, authorized: true, message: 'Autorizado' };
}
