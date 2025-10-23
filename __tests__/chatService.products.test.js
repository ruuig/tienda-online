import { ChatService } from '@/src/infrastructure/openai/chatService.js';

let classifyIntentMock;
let generateResponseMock;

jest.mock('@/src/infrastructure/openai/openaiClient.js', () => {
  classifyIntentMock = jest.fn();
  generateResponseMock = jest.fn();

  return {
    __esModule: true,
    OpenAIClient: jest.fn().mockImplementation(() => ({
      classifyIntent: classifyIntentMock,
      generateResponse: generateResponseMock,
      buildSystemMessage: jest.fn(),
    })),
  };
});

const initializeMock = jest.fn();
const searchProductsMock = jest.fn();

jest.mock('@/src/services/conversationalCartService.js', () => ({
  conversationalCartService: {
    initialize: initializeMock,
    searchProducts: searchProductsMock,
    findProductInMessage: jest.fn().mockResolvedValue(null),
    processProductPurchaseIntent: jest.fn(),
    getConversationState: jest.fn(),
    processUserResponse: jest.fn(),
    showCart: jest.fn(),
    startCheckout: jest.fn(),
    confirmPurchase: jest.fn(),
  },
}));

describe('ChatService product context handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    initializeMock.mockResolvedValue();
    searchProductsMock.mockResolvedValue([]);
  });

  test('injects filtered products into system prompt and response metadata', async () => {
    classifyIntentMock.mockResolvedValueOnce({ intent: 'consulta_producto', confidence: 0.92 });
    generateResponseMock.mockResolvedValueOnce('Tenemos laptops increíbles disponibles para ti.');

    const chatService = new ChatService('fake-key');
    const filteredProducts = [
      {
        _id: 'prod-1',
        name: 'Laptop Pro 15',
        category: 'laptop',
        offerPrice: 8999,
        inStock: true,
        description: 'Laptop potente para profesionales',
      },
      {
        _id: 'prod-2',
        name: 'Laptop Air 13',
        category: 'laptop',
        offerPrice: 7499,
        inStock: true,
        description: 'Ultraportátil ligera y elegante',
      },
    ];

    const result = await chatService.processUserMessage('conv-123', '¿Qué laptops tienen?', {
      products: filteredProducts,
      productsSummary: 'Resumen de laptops disponibles',
    });

    expect(result.success).toBe(true);
    expect(result.message.metadata.products).toEqual(filteredProducts);
    expect(result.message.metadata.productsCount).toBe(filteredProducts.length);

    const messages = generateResponseMock.mock.calls[0][0];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('Laptop Pro 15');
    expect(messages[0].content).toContain('Laptop Air 13');
    expect(messages[0].content).toContain('Solo puedes mencionar los productos listados a continuación');

    expect(initializeMock).toHaveBeenCalledWith(filteredProducts);
    expect(searchProductsMock).not.toHaveBeenCalled();
  });
});
