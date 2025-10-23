import mongoose from "mongoose";

const promptConfigSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  systemPrompt: {
    type: String,
    required: true,
    maxlength: 8000
  },
  greetingMessage: {
    type: String,
    required: true,
    maxlength: 500
  },
  rejectionMessage: {
    type: String,
    required: true,
    maxlength: 500
  },
  allowedTopics: [{
    type: String,
    enum: [
      'productos', 'precios', 'inventario', 'envíos', 'entregas',
      'pagos', 'devoluciones', 'garantías', 'soporte técnico',
      'catalogo', 'promociones', 'políticas'
    ]
  }],
  temperature: {
    type: Number,
    min: 0,
    max: 2,
    default: 0.7
  },
  maxTokens: {
    type: Number,
    min: 100,
    max: 2000,
    default: 500
  },
  model: {
    type: String,
    enum: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'],
    default: 'gpt-4'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
promptConfigSchema.index({ vendorId: 1 }, { unique: true });
promptConfigSchema.index({ isActive: 1, updatedAt: -1 });

// Middleware para incrementar versión
promptConfigSchema.pre('save', function(next) {
  if (this.isModified() && this.isModified() !== this.isNew) {
    this.version += 1;
  }
  this.updatedAt = new Date();
  next();
});

const PromptConfig = mongoose.models.PromptConfig || mongoose.model('PromptConfig', promptConfigSchema);

export default PromptConfig;
