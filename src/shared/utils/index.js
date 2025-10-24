// Utilidades compartidas para el proyecto

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Símbolo de moneda (por defecto 'Q')
 * @returns {string} Cantidad formateada
 */
export const formatCurrency = (amount, currency = 'Q') => {
  return `${currency}${amount.toFixed(2)}`;
};

/**
 * Calcula el total de items en el carrito
 * @param {Record<string, number>} cartItems - Objeto con items del carrito
 * @returns {number} Total de items
 */
export const getCartTotalItems = (cartItems) => {
  return Object.values(cartItems).reduce((total, quantity) => total + quantity, 0);
};

/**
 * Calcula el monto total del carrito
 * @param {Record<string, number>} cartItems - Objeto con items del carrito
 * @param {Array} products - Array de productos
 * @returns {number} Monto total formateado
 */
export const getCartTotalAmount = (cartItems, products) => {
  let totalAmount = 0;
  for (const [productId, quantity] of Object.entries(cartItems)) {
    const product = products.find(p => p._id === productId);
    if (product && quantity > 0) {
      totalAmount += product.offerPrice * quantity;
    }
  }
  return Math.floor(totalAmount * 100) / 100;
};

/**
 * Valida si un email tiene formato correcto
 * @param {string} email - Email a validar
 * @returns {boolean} Si el email es válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Genera un ID único (simple implementación)
 * @returns {string} ID único
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Formatea una fecha para mostrar
 * @param {number} timestamp - Timestamp en milisegundos
 * @returns {string} Fecha formateada
 */
export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Obtiene el precio con descuento aplicado
 * @param {number} originalPrice - Precio original
 * @param {number} discountPercentage - Porcentaje de descuento
 * @returns {number} Precio con descuento
 */
export const applyDiscount = (originalPrice, discountPercentage) => {
  return originalPrice * (1 - discountPercentage / 100);
};
