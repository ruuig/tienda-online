// Implementaciones de repositorios que usan los modelos reales
import { Product, User, Order, Address, HeaderSlider } from '@/src/domain/entities';
import { IProductRepository, IUserRepository, IOrderRepository, IHeaderSliderRepository } from '@/src/domain/repositories';

export class ProductRepositoryImpl extends IProductRepository {
  async findById(id) {
    return await Product.findById(id);
  }

  async findAll() {
    return await Product.find({}).sort({ date: -1 });
  }

  async create(productData) {
    const newProduct = new Product(productData);
    return await newProduct.save();
  }

  async update(id, productData) {
    return await Product.findByIdAndUpdate(id, productData, { new: true });
  }

  async delete(id) {
    return await Product.findByIdAndDelete(id);
  }
}

export class UserRepositoryImpl extends IUserRepository {
  async findById(id) {
    return await User.findById(id);
  }

  async create(userData) {
    const newUser = new User(userData);
    return await newUser.save();
  }

  async update(id, userData) {
    return await User.findByIdAndUpdate(id, userData, { new: true });
  }
}

export class OrderRepositoryImpl extends IOrderRepository {
  async findByUserId(userId) {
    return await Order.find({ userId }).populate('address items.product');
  }

  async findAll() {
    return await Order.find({}).populate('address items.product');
  }

  async create(orderData) {
    const newOrder = new Order(orderData);
    return await newOrder.save();
  }
}

export class HeaderSliderRepositoryImpl extends IHeaderSliderRepository {
  async findOne(query) {
    return await HeaderSlider.findOne(query);
  }

  async findOneAndUpdate(query, update, options) {
    return await HeaderSlider.findOneAndUpdate(query, update, options);
  }
}
