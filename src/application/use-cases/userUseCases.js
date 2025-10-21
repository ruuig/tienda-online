// Caso de uso para obtener datos de usuario
import { IUserRepository } from '@/src/domain/repositories';

export class GetUserDataUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    try {
      let user = await this.userRepository.findById(userId);

      if (!user) {
        // Si el usuario no existe, devolver datos básicos indicando que necesita ser creado
        return {
          success: true,
          user: null,
          needsCreation: true,
          message: 'Usuario no encontrado, necesita ser creado'
        };
      }

      return { success: true, user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export class CreateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, userData) {
    try {
      const newUser = await this.userRepository.create({
        _id: userId,
        ...userData,
        cartItems: {}
      });

      return { success: true, message: 'Usuario creado exitosamente', user: newUser };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
