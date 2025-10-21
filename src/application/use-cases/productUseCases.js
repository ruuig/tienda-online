// Caso de uso para obtener productos
import { IProductRepository } from '@/src/domain/repositories';

export class GetProductsUseCase {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute() {
    try {
      const products = await this.productRepository.findAll();
      return { success: true, products };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class GetProductByIdUseCase {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute(id) {
    try {
      const product = await this.productRepository.findById(id);
      if (!product) {
        return { success: false, message: 'Producto no encontrado' };
      }
      return { success: true, product };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class GetSellerProductsUseCase {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute() {
    try {
      const products = await this.productRepository.findAll();
      return { success: true, products };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class CreateProductUseCase {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute(sellerId, productData, imageUrls = []) {
    try {
      const newProduct = {
        ...productData,
        sellerId,
        images: imageUrls,
        date: new Date()
      };

      const product = await this.productRepository.create(newProduct);
      return { success: true, product };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
