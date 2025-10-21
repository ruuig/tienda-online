import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    default: "Nueva conversación"
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'escalated'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignedTo: {
    type: String,
    default: null // ID del admin asignado
  },
  tags: [{
    type: String
  }],
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String
  },
  lastActivity: {
    type: Date,
    default: Date.now
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

// Índices para optimizar consultas
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ status: 1, priority: 1 });
conversationSchema.index({ assignedTo: 1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;
