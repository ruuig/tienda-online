// Servicio de contexto de negocio simplificado
export class BusinessContextService {
  constructor() {
    this.businessInfo = null;
    this.products = [];
    this.initialized = false;
  }

  async initializeBusinessContext() {
    try {
      console.log('BusinessContextService: Inicializando contexto de negocio...');

      // Datos por defecto para desarrollo
      this.businessInfo = {
        id: 'business_1',
        name: 'Tienda Online Tech',
        description: 'Especialistas en tecnología y productos electrónicos',
        location: 'Guatemala City, Guatemala',
        phone: '+502 1234-5678',
        email: 'info@tiendaonlinetech.com',
        hours: 'Lunes a Viernes 8:00 AM - 6:00 PM, Sábados 9:00 AM - 4:00 PM',
        warranty: '1 año en todos los productos',
        returns: '30 días para productos sin usar',
        paymentMethods: 'Efectivo, Tarjeta de Crédito, Débito, Transferencia',
        deliveryTime: '2-3 días hábiles en ciudad capital, 3-5 días en interior',
        freeShipping: 'Compras mayores a Q500'
      };

      // Productos de ejemplo
      this.products = [
        {
          id: 'prod_1',
          name: 'iPhone 15 Pro Max',
          category: 'smartphone',
          brand: 'Apple',
          price: 9500,
          offerPrice: 8500,
          stock: 15,
          description: 'El iPhone más avanzado con cámara profesional y chip A17 Pro',
          rating: 4.8,
          isActive: true
        },
        {
          id: 'prod_2',
          name: 'MacBook Pro 16" M3',
          category: 'laptop',
          brand: 'Apple',
          price: 18500,
          offerPrice: 16500,
          stock: 8,
          description: 'Laptop profesional con chip M3 y pantalla Liquid Retina XDR',
          rating: 4.9,
          isActive: true
        },
        {
          id: 'prod_3',
          name: 'Sony WH-1000XM5',
          category: 'headphone',
          brand: 'Sony',
          price: 2800,
          offerPrice: 2400,
          stock: 25,
          description: 'Audífonos inalámbricos con cancelación de ruido líder',
          rating: 4.7,
          isActive: true
        }
      ];

      this.initialized = true;
      console.log(`BusinessContextService: Inicializado con ${this.products.length} productos`);

      return {
        success: true,
        productsCount: this.products.length
      };
    } catch (error) {
      console.error('BusinessContextService: Error inicializando:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  searchProducts(searchTerm, limit = 10) {
    const lowerSearch = searchTerm.toLowerCase();

    return this.products.filter(product => {
      if (!product.isActive) return false;

      return (
        product.name.toLowerCase().includes(lowerSearch) ||
        product.brand.toLowerCase().includes(lowerSearch) ||
        product.category.toLowerCase().includes(lowerSearch) ||
        product.description.toLowerCase().includes(lowerSearch)
      );
    }).slice(0, limit);
  }

  getBusinessInfo() {
    return this.businessInfo;
  }

  hasProducts() {
    return this.products.length > 0;
  }

  getStats() {
    const activeProducts = this.products.filter(p => p.isActive);
    return {
      initialized: this.initialized,
      totalProducts: this.products.length,
      activeProducts: activeProducts.length,
      businessInfo: !!this.businessInfo
    };
  }
}

export const createBusinessContextService = () => {
  return new BusinessContextService();
};
