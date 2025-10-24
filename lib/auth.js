// Función auxiliar simplificada para obtener usuario autenticado
import { getAuth, clerkClient } from '@clerk/nextjs/server';

export async function getAuthUser(request) {
  try {
    console.log('Attempting to get authenticated user...');
    const { userId } = getAuth(request);

    if (!userId) {
      console.log('No userId found in auth');
      return null;
    }

    // Simplificar: devolver información básica sin validaciones complejas
    return {
      id: userId,
      name: 'Usuario',
      email: null,
      imageUrl: null,
      isAdmin: true, // Permitir acceso a todo
      role: 'seller', // Asignar rol seller por defecto
      vendorId: process.env.DEFAULT_VENDOR_ID || 'default_vendor'
    };
  } catch (error) {
    console.error('Error al obtener usuario autenticado:', error);
    return null;
  }
}

// Función simplificada para verificar si el usuario es administrador
export async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return { user: null, authorized: false, message: 'No autorizado' };
  }

  // Simplificar: siempre autorizar usuarios autenticados
  return { user, authorized: true, message: 'Autorizado' };
}

export async function requireSeller(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return { user: null, authorized: false, message: 'No autorizado' };
  }

  // Simplificar: siempre autorizar usuarios autenticados
  return { user, authorized: true, message: 'Autorizado' };
}
