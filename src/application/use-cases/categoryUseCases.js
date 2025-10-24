// Casos de uso para categorías
import { ICategoryRepository } from '@/src/domain/repositories';

export class GetCategoriesUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async execute(userId) {
    try {
      const categories = await this.categoryRepository.findActive();
      return { success: true, categories };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class GetCategoryByIdUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async execute(id) {
    try {
      const category = await this.categoryRepository.findById(id);
      if (!category) {
        return { success: false, message: 'Categoría no encontrada' };
      }
      return { success: true, category };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class GetUserCategoriesUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async execute(userId) {
    try {
      const categories = await this.categoryRepository.findByUserId(userId);
      return { success: true, categories };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class CreateCategoryUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async execute(userId, categoryData) {
    try {
      // Verificar si ya existe una categoría con ese nombre
      const existingCategory = await this.categoryRepository.findByName(categoryData.name);
      if (existingCategory) {
        return { success: false, message: 'Ya existe una categoría con ese nombre' };
      }

      const newCategory = {
        ...categoryData,
        userId,
        name: categoryData.name.toLowerCase(),
        date: Date.now(),
        isActive: true
      };

      const category = await this.categoryRepository.create(newCategory);
      return { success: true, category };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class UpdateCategoryUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async execute(id, categoryData, userId) {
    try {
      // Verificar que la categoría existe y pertenece al usuario
      const existingCategory = await this.categoryRepository.findById(id);
      if (!existingCategory) {
        return { success: false, message: 'Categoría no encontrada' };
      }

      if (existingCategory.userId !== userId) {
        return { success: false, message: 'No tienes permisos para modificar esta categoría' };
      }

      // Si se está cambiando el nombre, verificar que no exista otro con ese nombre
      if (categoryData.name && categoryData.name !== existingCategory.name) {
        const duplicateCategory = await this.categoryRepository.findByName(categoryData.name);
        if (duplicateCategory) {
          return { success: false, message: 'Ya existe una categoría con ese nombre' };
        }
        categoryData.name = categoryData.name.toLowerCase();
      }

      const updatedCategory = await this.categoryRepository.update(id, categoryData);
      return { success: true, category: updatedCategory };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class DeleteCategoryUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async execute(id, userId) {
    try {
      // Verificar que la categoría existe y pertenece al usuario
      const existingCategory = await this.categoryRepository.findById(id);
      if (!existingCategory) {
        return { success: false, message: 'Categoría no encontrada' };
      }

      if (existingCategory.userId !== userId) {
        return { success: false, message: 'No tienes permisos para eliminar esta categoría' };
      }

      await this.categoryRepository.delete(id);
      return { success: true, message: 'Categoría eliminada correctamente' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class ToggleCategoryStatusUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async execute(id, userId) {
    try {
      // Verificar que la categoría existe y pertenece al usuario
      const existingCategory = await this.categoryRepository.findById(id);
      if (!existingCategory) {
        return { success: false, message: 'Categoría no encontrada' };
      }

      if (existingCategory.userId !== userId) {
        return { success: false, message: 'No tienes permisos para modificar esta categoría' };
      }

      const updatedCategory = await this.categoryRepository.update(id, {
        isActive: !existingCategory.isActive
      });

      return {
        success: true,
        category: updatedCategory,
        message: updatedCategory.isActive ? 'Categoría activada' : 'Categoría desactivada'
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
