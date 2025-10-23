// Servicio de historial de conversaciones simplificado
export class ConversationHistoryService {
  constructor() {
    this.conversations = new Map();
    this.maxMessagesPerConversation = 50;
  }

  getConversation(conversationId) {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, {
        id: conversationId,
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        summary: {
          totalMessages: 0,
          userMessages: 0,
          botMessages: 0,
          intents: {},
          topics: []
        }
      });
    }

    const conversation = this.conversations.get(conversationId);
    conversation.lastActivity = new Date();
    return conversation;
  }

  addMessage(conversationId, message) {
    const conversation = this.getConversation(conversationId);

    conversation.messages.push({
      ...message,
      timestamp: new Date()
    });

    // Actualizar estadísticas
    conversation.summary.totalMessages++;
    if (message.sender === 'user') {
      conversation.summary.userMessages++;
    } else if (message.sender === 'bot') {
      conversation.summary.botMessages++;
    }

    // Limitar mensajes
    if (conversation.messages.length > this.maxMessagesPerConversation) {
      conversation.messages = conversation.messages.slice(-this.maxMessagesPerConversation);
    }

    return conversation;
  }

  getConversationHistory(conversationId) {
    const conversation = this.getConversation(conversationId);
    return {
      ...conversation,
      context: this.generateConversationContext(conversation)
    };
  }

  generateConversationContext(conversation) {
    const recentMessages = conversation.messages.slice(-5);

    return {
      totalMessages: conversation.summary.totalMessages,
      mainTopics: conversation.summary.topics.slice(0, 3),
      recentUserMessages: recentMessages
        .filter(m => m.sender === 'user')
        .map(m => m.content)
    };
  }

  formatConversationHistory(conversationHistory) {
    const recentMessages = conversationHistory.messages.slice(-10);
    return recentMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  getStats() {
    const conversations = Array.from(this.conversations.values());
    return {
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum, c) => sum + c.summary.totalMessages, 0),
      activeConversations: conversations.filter(c =>
        Date.now() - c.lastActivity.getTime() < 2 * 60 * 60 * 1000 // 2 horas
      ).length
    };
  }

  cleanupOldConversations() {
    const now = Date.now();
    const toDelete = [];

    this.conversations.forEach((conversation, conversationId) => {
      if (now - conversation.lastActivity.getTime() > 24 * 60 * 60 * 1000) { // 24 horas
        toDelete.push(conversationId);
      }
    });

    toDelete.forEach(conversationId => {
      this.conversations.delete(conversationId);
    });

    return toDelete.length;
  }
}

export const createConversationHistoryService = () => {
  return new ConversationHistoryService();
};
