// Caso de uso para crear orden
import { IOrderRepository, IUserRepository, IProductRepository } from '@/src/domain/repositories';

export class CreateOrderUseCase {
  constructor(orderRepository, userRepository, productRepository) {
    this.orderRepository = orderRepository;
    this.userRepository = userRepository;
    this.productRepository = productRepository;
  }

  async execute(userId, address, items, discountId = null, discountAmount = 0) {
    try {
      // Validar datos
      if (!address || !items || items.length === 0) {
        return { success: false, message: 'Datos inválidos' };
      }

      // Calcular monto
      let amount = 0;
      for (const item of items) {
        const product = await this.productRepository.findById(item.product);
        if (product) {
          amount += product.offerPrice * item.quantity;
        }
      }

      // Agregar impuesto (2%)
      const taxAmount = Math.floor(amount * 0.02);
      const subtotalWithTax = amount + taxAmount;

      // Aplicar descuento si existe
      const finalAmount = discountAmount > 0
        ? Math.max(0, subtotalWithTax - discountAmount)
        : subtotalWithTax;

      // Crear orden
      const orderData = {
        userId,
        items,
        amount: finalAmount,
        originalAmount: subtotalWithTax,
        discountAmount: discountAmount,
        discountId: discountId,
        taxAmount: taxAmount,
        address,
        status: 'Order Placed',
        date: Date.now()
      };

      const newOrder = await this.orderRepository.create(orderData);

      // Limpiar carrito del usuario
      await this.userRepository.update(userId, { cartItems: {} });

      return { success: true, message: 'Orden creada exitosamente', order: newOrder };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class GetSellerOrdersUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute() {
    try {
      const orders = await this.orderRepository.findAll();
      return { success: true, orders };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}


// Caso de uso para obtener órdenes de un usuario
export class GetOrdersUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(userId) {
    try {
      const orders = await this.orderRepository.findByUserId(userId);
      return { success: true, orders };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
