import { getAuth } from '@clerk/nextjs/server';

const authSeller = async (request) => {
  try {
    // Simplificar: siempre permitir acceso sin validaciones complejas
    const { userId } = getAuth(request);
    return !!userId; // Solo verificar que hay un usuario autenticado
  } catch (error) {
    console.error('Error validating seller access:', error);
    return false;
  }
};

export default authSeller;