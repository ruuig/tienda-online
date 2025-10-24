// Tipos compartidos para el proyecto usando JSDoc

/**
 * @typedef {Object} Product
 * @property {string} _id - ID único del producto
 * @property {string} name - Nombre del producto
 * @property {string} description - Descripción del producto
 * @property {string} category - Categoría del producto
 * @property {number} price - Precio original
 * @property {number} offerPrice - Precio con oferta
 * @property {string[]} image - URLs de imágenes
 * @property {string} userId - ID del vendedor
 * @property {number} date - Timestamp de creación
 */

/**
 * @typedef {Object} User
 * @property {string} _id - ID único del usuario
 * @property {string} name - Nombre del usuario
 * @property {string} email - Email del usuario
 * @property {string} [imageUrl] - URL de imagen del usuario
 * @property {Record<string, number>} cartItems - Items en el carrito
 */

/**
 * @typedef {Object} Order
 * @property {string} _id - ID único de la orden
 * @property {string} userId - ID del usuario que hizo la orden
 * @property {Array<{product: string, quantity: number, price?: number}>} items - Items de la orden
 * @property {number} amount - Monto total
 * @property {{street: string, city: string, state: string, zipCode: string, country: string}} address - Dirección de envío
 * @property {'Order Placed'|'Shipped'|'Delivered'|'Cancelled'} status - Estado de la orden
 * @property {number} date - Timestamp de creación
 */

/**
 * @typedef {Object} HeaderSlider
 * @property {string} [_id] - ID único del slider
 * @property {Array<{id: number, title: string, offer: string, buttonText1: string, buttonText2: string, imgSrc: string}>} slides - Slides del slider
 */

/**
 * @typedef {Object} CartItem
 * @property {string} productId - ID del producto
 * @property {number} quantity - Cantidad
 * @property {Product} [product] - Información del producto (opcional)
 */

// DTOs para APIs

/**
 * @typedef {Object} CreateProductDTO
 * @property {string} name - Nombre del producto
 * @property {string} description - Descripción del producto
 * @property {string} category - Categoría del producto
 * @property {number} price - Precio original
 * @property {number} offerPrice - Precio con oferta
 * @property {string[]} image - URLs de imágenes
 * @property {string} userId - ID del vendedor
 * @property {number} date - Timestamp de creación
 */

/**
 * @typedef {Object} CreateOrderDTO
 * @property {string} userId - ID del usuario
 * @property {Array<{product: string, quantity: number, price?: number}>} items - Items de la orden
 * @property {{street: string, city: string, state: string, zipCode: string, country: string}} address - Dirección de envío
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Si la operación fue exitosa
 * @property {string} [message] - Mensaje de respuesta
 * @property {*} [data] - Datos de respuesta
 * @property {string} [error] - Mensaje de error
 */
