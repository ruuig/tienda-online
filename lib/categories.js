// Archivo centralizado para categorías de productos
// Se usa en toda la aplicación para mantener consistencia

export const CATEGORY_NAMES = {
  'smartphone': 'Smartphones',
  'laptop': 'Computadoras',
  'earphone': 'Earphones',
  'headphone': 'Headphones',
  'watch': 'Relojes Inteligentes',
  'camera': 'Cámaras',
  'accessories': 'Accesorios',
  'tablet': 'Tablets',
  'console': 'Consolas',
  'gaming': 'Juegos',
  'home': 'Hogar',
  'electronics': 'Electrónicos',
  'mobile': 'Móviles',
  'audio': 'Audio',
  'wearables': 'Wearables'
};

export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
  { value: 'price-asc', label: 'Precio: Menor a Mayor' },
  { value: 'price-desc', label: 'Precio: Mayor a Menor' },
  { value: 'date-desc', label: 'Más Recientes' },
  { value: 'date-asc', label: 'Más Antiguos' }
];

// Función para obtener todas las categorías disponibles como array de objetos
export const getAllCategories = () => {
  return Object.keys(CATEGORY_NAMES).map(category => ({
    value: category,
    label: CATEGORY_NAMES[category]
  }));
};

// Función para obtener categorías con "All" al inicio
export const getCategoriesWithAll = () => {
  const allCategories = getAllCategories();
  return [{ value: 'All', label: 'Todas las categorías' }, ...allCategories];
};

// Función para obtener categorías como array simple (para compatibilidad con código existente)
export const getCategoriesArray = () => {
  return ['All', ...Object.keys(CATEGORY_NAMES)];
};
