import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  socketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    platform: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas eficientes
chatSessionSchema.index({ conversationId: 1, isActive: 1 });
chatSessionSchema.index({ userId: 1, isActive: 1 });

// TTL para limpiar sesiones inactivas después de 24 horas
chatSessionSchema.index({ lastActivity: 1 }, {
  expireAfterSeconds: 24 * 60 * 60
});

const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
