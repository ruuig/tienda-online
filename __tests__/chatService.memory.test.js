import { ChatService } from '@/src/infrastructure/openai/chatService.js';

let classifyIntentMock;
let generateResponseMock;
let conversationPersistenceMock;

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

jest.mock('@/src/infrastructure/chat/conversationPersistenceService.js', () => {
  conversationPersistenceMock = {
    getRecentMessages: jest.fn().mockResolvedValue([]),
  };

  return {
    __esModule: true,
    ConversationPersistenceService: jest
      .fn()
      .mockImplementation(() => conversationPersistenceMock),
  };
});

jest.mock('@/src/services/conversationalCartService.js', () => ({
  conversationalCartService: {
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

describe('ChatService conversation memory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    conversationPersistenceMock.getRecentMessages.mockResolvedValue([]);
  });

  test('passes previous turns to OpenAI when generating response', async () => {
    const previousMessages = [
      { sender: 'user', content: 'Hola, estoy buscando la laptop Strix 16.' },
      { sender: 'bot', content: 'Claro, la Strix 16 trae 32GB de RAM y una RTX 4070.' },
    ];

    conversationPersistenceMock.getRecentMessages.mockResolvedValue(previousMessages);
    classifyIntentMock.mockResolvedValueOnce({ intent: 'consulta_producto', confidence: 0.91 });

    generateResponseMock.mockImplementationOnce((messages) => {
      const assistantMessages = messages.filter((msg) => msg.role === 'assistant');
      const remembersSpecs = assistantMessages.some((msg) =>
        msg.content.includes('32GB de RAM')
      );

      expect(remembersSpecs).toBe(true);

      const userTurns = messages
        .filter((msg) => msg.role === 'user')
        .map((msg) => msg.content);

      expect(userTurns).toEqual([
        'Hola, estoy buscando la laptop Strix 16.',
        '¿Y cuánto dura la batería?',
      ]);

      return 'La Strix 16 mantiene los 32GB de RAM y ofrece hasta 10 horas de batería.';
    });

    const chatService = new ChatService('fake-key');
    const result = await chatService.processUserMessage(
      'conversation-memory-1',
      '¿Y cuánto dura la batería?',
      {}
    );

    expect(conversationPersistenceMock.getRecentMessages).toHaveBeenCalledWith(
      'conversation-memory-1',
      { limit: 12 }
    );
    expect(result.success).toBe(true);
    expect(result.message.content).toContain('10 horas de batería');
  });

  test('avoids duplicating the latest user message when history already contains it', async () => {
    conversationPersistenceMock.getRecentMessages.mockResolvedValue([
      { sender: 'user', content: '¿Tienen promociones de laptops?' },
    ]);

    classifyIntentMock.mockResolvedValueOnce({ intent: 'consulta_producto', confidence: 0.78 });

    generateResponseMock.mockImplementationOnce((messages) => {
      const duplicates = messages.filter(
        (msg) => msg.role === 'user' && msg.content === '¿Tienen promociones de laptops?'
      );

      expect(duplicates).toHaveLength(1);

      return 'Tenemos promociones especiales en laptops gamer esta semana.';
    });

    const chatService = new ChatService('fake-key');
    const result = await chatService.processUserMessage(
      'conversation-memory-2',
      '¿Tienen promociones de laptops?',
      {}
    );

    expect(result.success).toBe(true);
    expect(result.message.content).toContain('promociones especiales');
  });
});
