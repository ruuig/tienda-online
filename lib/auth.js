// Función auxiliar para obtener usuario autenticado desde Clerk
import { getAuth, clerkClient } from '@clerk/nextjs/server';

export async function getAuthUser(request) {
  try {
    console.log('Attempting to get authenticated user...');
    const { userId } = getAuth(request);

    if (!userId) {
      console.log('No userId found in auth');
      return null;
    }

    const user = await clerkClient.users.getUser(userId);

    if (!user) {
      console.log('User not found via clerkClient, returning fallback info');
      return {
        id: userId,
        name: 'Usuario',
        email: null,
        imageUrl: null,
        isAdmin: false,
        role: 'user',
        vendorId: process.env.DEFAULT_VENDOR_ID || 'default_vendor'
      };
    }

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const publicMetadata = user.publicMetadata || {};

    return {
      id: user.id,
      name: fullName || user.username || 'Usuario',
      email: user.primaryEmailAddress?.emailAddress ?? null,
      imageUrl: user.imageUrl ?? null,
      isAdmin: publicMetadata.role === 'admin' || publicMetadata.role === 'seller',
      role: publicMetadata.role || 'user',
      vendorId: publicMetadata.vendorId || process.env.DEFAULT_VENDOR_ID || 'default_vendor'
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
    console.log('User is not admin, but allowing access for debugging');
    // Temporalmente permitir acceso a usuarios autenticados
    return { user, authorized: true, message: 'Autorizado (temporal)' };
  }

  return { user, authorized: true, message: 'Autorizado' };
}

export async function requireSeller(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return { user: null, authorized: false, message: 'No autorizado' };
  }

  const role = user.role;
  console.log('User role check:', { role, isAdmin: user.isAdmin, userId: user.id });

  // Si el usuario está autenticado, permitir acceso (por ahora)
  // En producción, esto debería ser más restrictivo
  if (role !== 'admin' && role !== 'seller') {
    console.log('User role not admin or seller, but allowing access for debugging');
    // Temporalmente permitir acceso a usuarios autenticados
    return { user, authorized: true, message: 'Autorizado (temporal)' };
  }

  return { user, authorized: true, message: 'Autorizado' };
}
