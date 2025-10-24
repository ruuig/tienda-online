import Product from '@/src/infrastructure/database/models/productModel.js';
import { searchProductsForMessage } from '@/app/api/chat/process-message/route.js';

jest.mock('@/src/infrastructure/database/models/productModel.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

describe('searchProductsForMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildQueryMocks = (results) => {
    const leanMock = jest.fn().mockResolvedValue(results);
    const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
    return { leanMock, limitMock, query: { limit: limitMock } };
  };

  test('filters products by detected category and query tokens', async () => {
    const mockResults = [
      { _id: '1', name: 'Laptop Gamer', category: 'laptop' },
      { _id: '2', name: 'Laptop Ultrabook', category: 'laptop' },
    ];

    const { query } = buildQueryMocks(mockResults);
    Product.find.mockReturnValueOnce(query);

    const vendorId = '507f1f77bcf86cd799439011';
    const results = await searchProductsForMessage('¿Qué laptops tienen disponibles?', vendorId, 5);

    expect(Product.find).toHaveBeenCalledTimes(1);
    const calledFilter = Product.find.mock.calls[0][0];
    expect(calledFilter.status).toBe('active');
    expect(calledFilter.vendorId).toBe(vendorId);
    expect(calledFilter.category.$in).toContain('laptop');
    expect(Array.isArray(calledFilter.$or)).toBe(true);
    expect(results).toEqual(mockResults);
  });

  test('falls back to base query when no tokens are detected', async () => {
    const mockResults = [{ _id: '3', name: 'Smartphone Básico', category: 'smartphone' }];
    const primaryQuery = buildQueryMocks([]);
    const fallbackLean = jest.fn().mockResolvedValue(mockResults);
    const fallbackQuery = {
      sort: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ lean: fallbackLean }) }),
    };

    Product.find
      .mockReturnValueOnce(primaryQuery.query)
      .mockReturnValueOnce(fallbackQuery);

    const results = await searchProductsForMessage('hola', '507f1f77bcf86cd799439011', 5);

    expect(Product.find).toHaveBeenCalledTimes(2);
    const firstFilter = Product.find.mock.calls[0][0];
    expect(firstFilter.$or).toBeUndefined();
    expect(results).toEqual(mockResults);
  });
});
