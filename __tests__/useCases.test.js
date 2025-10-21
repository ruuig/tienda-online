// Pruebas básicas para casos de uso
import { GetProductsUseCase } from '@/src/application/use-cases/productUseCases'
import { ProductRepositoryImpl } from '@/src/infrastructure/database/repositories'

// Mock del repositorio
jest.mock('@/src/infrastructure/database/repositories', () => ({
  ProductRepositoryImpl: jest.fn().mockImplementation(() => ({
    findAll: jest.fn(),
  })),
}))

describe('Product Use Cases', () => {
  let mockRepository
  let getProductsUseCase

  beforeEach(() => {
    mockRepository = new ProductRepositoryImpl()
    getProductsUseCase = new GetProductsUseCase(mockRepository)
  })

  describe('GetProductsUseCase', () => {
    test('should return products successfully', async () => {
      const mockProducts = [
        { _id: '1', name: 'Producto 1', price: 100 },
        { _id: '2', name: 'Producto 2', price: 200 },
      ]

      mockRepository.findAll.mockResolvedValue(mockProducts)

      const result = await getProductsUseCase.execute()

      expect(result.success).toBe(true)
      expect(result.products).toEqual(mockProducts)
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1)
    })

    test('should handle repository errors', async () => {
      const errorMessage = 'Database connection failed'
      mockRepository.findAll.mockRejectedValue(new Error(errorMessage))

      const result = await getProductsUseCase.execute()

      expect(result.success).toBe(false)
      expect(result.message).toContain(errorMessage)
    })

    test('should handle empty products list', async () => {
      mockRepository.findAll.mockResolvedValue([])

      const result = await getProductsUseCase.execute()

      expect(result.success).toBe(true)
      expect(result.products).toEqual([])
    })
  })
})
