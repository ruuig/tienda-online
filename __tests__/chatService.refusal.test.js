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

jest.mock('@/src/services/conversationalCartService.js', () => ({
  conversationalCartService: {
    initialize: jest.fn().mockResolvedValue(),
    searchProducts: jest.fn().mockResolvedValue([]),
    findProductInMessage: jest.fn().mockResolvedValue(null),
    processProductPurchaseIntent: jest.fn(),
    getConversationState: jest.fn(),
    processUserResponse: jest.fn(),
    showCart: jest.fn(),
    startCheckout: jest.fn(),
    confirmPurchase: jest.fn(),
  },
}));

describe('ChatService off-topic handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns canned refusal before calling OpenAI for off-topic intent', async () => {
    classifyIntentMock.mockResolvedValueOnce({ intent: 'otra', confidence: 0.21 });

    const chatService = new ChatService('fake-key');
    const result = await chatService.processUserMessage('conv-1', '¿Quién es Hitler?', {});

    expect(result.success).toBe(true);
    expect(result.message.metadata.refusal).toBe(true);
    expect(result.message.content).toContain('Soy un asistente especializado únicamente en productos tecnológicos');
    expect(result.message.content).toContain('temas generales como Quién es Hitler');
    expect(generateResponseMock).not.toHaveBeenCalled();
  });

  test('falls back to OpenAI flow for store-related queries', async () => {
    classifyIntentMock.mockResolvedValueOnce({ intent: 'consulta_producto', confidence: 0.92 });
    generateResponseMock.mockResolvedValueOnce('Aquí tienes la información del smartphone solicitado.');

    const chatService = new ChatService('fake-key');
    const result = await chatService.processUserMessage('conv-2', 'Quiero conocer un smartphone gaming', { products: [] });

    expect(generateResponseMock).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.message.content).toBe('Aquí tienes la información del smartphone solicitado.');
    expect(result.message.metadata.refusal).toBeUndefined();
  });
});
