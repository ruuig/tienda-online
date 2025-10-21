// Caso de uso para obtener carrito
import { ICartRepository } from '@/src/domain/repositories';

export class GetCartUseCase {
  constructor(cartRepository) {
    this.cartRepository = cartRepository;
  }

  async execute(userId) {
    try {
      const cartItems = await this.cartRepository.getCart(userId);
      return { success: true, cartItems };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class UpdateCartUseCase {
  constructor(cartRepository) {
    this.cartRepository = cartRepository;
  }

  async execute(userId, cartData) {
    try {
      await this.cartRepository.updateCart(userId, cartData);
      return { success: true, message: 'Carrito actualizado exitosamente' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
