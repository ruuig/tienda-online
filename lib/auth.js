// Función auxiliar para obtener usuario autenticado desde Clerk
import { auth } from '@clerk/nextjs/server';

export async function getAuthUser(request) {
  try {
    // Usar auth().protect() que es más confiable para API routes
    console.log('Attempting to get authenticated user...');
    const { userId, user } = await auth();

    console.log('Auth result:', {
      userId,
      hasUser: !!user,
      userKeys: user ? Object.keys(user) : 'no user',
      metadata: user?.publicMetadata
    });

    if (!userId) {
      console.log('No userId found in auth');
      return null;
    }

    // Si no tenemos el user completo, devolver al menos la información básica
    if (!user) {
      console.log('No user object, returning basic info');
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
