// Casos de uso para carrito
import { IUserRepository, IProductRepository } from '@/src/domain/repositories';

export class AddToCartUseCase {
  constructor(userRepository, productRepository) {
    this.userRepository = userRepository;
    this.productRepository = productRepository;
  }

  async execute(userId, productId, quantity = 1) {
    try {
      // Verificar que el producto existe
      const product = await this.productRepository.findById(productId);
      if (!product) {
        return { success: false, message: 'Producto no encontrado' };
      }

      // Obtener usuario
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      // Actualizar carrito
      const cartItems = { ...user.cartItems };
      cartItems[productId] = (cartItems[productId] || 0) + quantity;

      // Guardar cambios
      await this.userRepository.update(userId, { cartItems });

      return { success: true, message: 'Producto agregado al carrito' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class UpdateCartUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, cartData) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      // Actualizar carrito
      await this.userRepository.update(userId, { cartItems: cartData });

      return { success: true, message: 'Carrito actualizado' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class GetCartUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      return { success: true, cartItems: user.cartItems };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
