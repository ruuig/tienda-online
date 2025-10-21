import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'bot', 'admin'],
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  metadata: {
    // Para mensajes de imagen/archivo
    fileName: String,
    fileSize: Number,
    mimeType: String,
    // Para respuestas de bot
    confidence: Number,
    sources: [String], // Documentos usados en RAG
    processingTime: Number, // ms que tomó generar respuesta
    // Para mensajes de admin
    adminId: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: String,
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
