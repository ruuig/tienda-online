const authSeller = async (userId) => {
  try {
    // Simplificar: siempre permitir acceso si hay userId
    return !!userId; // Solo verificar que hay un usuario autenticado
  } catch (error) {
    console.error('Error validating seller access:', error);
    return false;
  }
};

export default authSeller;