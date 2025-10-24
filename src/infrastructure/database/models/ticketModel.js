import mongoose from "mongoose";

const ticketMessageSchema = new mongoose.Schema({
  senderType: {
    type: String,
    enum: ['user', 'admin', 'bot', 'system'],
    required: true
  },
  senderId: {
    type: String,
    default: null
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'note', 'update', 'attachment', 'system'],
    default: 'text'
  },
  attachments: [{
    name: String,
    url: String,
    mimeType: String,
    size: Number
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ticketSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null
  },
  userId: {
    type: String,
    index: true,
    default: null
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'escalated'],
    default: 'open',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'orders', 'account', 'products', 'shipping', 'returns', 'other'],
    required: true,
    index: true
  },
  assignedTo: {
    type: String, // ID del admin asignado
    default: null
  },
  tags: [{
    type: String
  }],
  resolution: {
    type: String // Descripción de cómo se resolvió
  },
  satisfaction: {
    type: Number,
    min: 1,
    max: 5 // Rating del usuario sobre la resolución
  },
  metadata: {
    source: String, // De dónde viene el ticket (chat, email, phone)
    channel: String, // Canal específico
    senderName: String,
    senderEmail: String,
    subject: String,
    firstResponseTime: Date,
    resolutionTime: Date,
    reopenedCount: {
      type: Number,
      default: 0
    }
  },
  messages: {
    type: [ticketMessageSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para optimización
ticketSchema.index({ userId: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ category: 1, status: 1 });
ticketSchema.index({ 'metadata.source': 1, status: 1 });

const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);

export default Ticket;
