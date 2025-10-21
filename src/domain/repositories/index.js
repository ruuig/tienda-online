// Interfaces de repositorios para definir contratos
export class IUserRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async create(userData) {
    throw new Error('Method not implemented');
  }

  async update(id, userData) {
    throw new Error('Method not implemented');
  }
}

export class IOrderRepository {
  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async create(orderData) {
    throw new Error('Method not implemented');
  }
}

export class IProductRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async create(productData) {
    throw new Error('Method not implemented');
  }

  async update(id, productData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }
}

export class IHeaderSliderRepository {
  async findOne(query) {
    throw new Error('Method not implemented');
  }

  async findOneAndUpdate(query, update, options) {
    throw new Error('Method not implemented');
  }
}
