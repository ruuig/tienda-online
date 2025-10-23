import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  vendorId: {
    type: String,
    default: process.env.DEFAULT_VENDOR_ID || process.env.NEXT_PUBLIC_VENDOR_ID || 'default_vendor',
    index: true
  },
  title: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['faq', 'manual', 'policy', 'guide', 'other'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['products', 'orders', 'account', 'shipping', 'returns', 'technical', 'other'],
    default: 'other',
    index: true
  },
  tags: [{
    type: String,
    index: true
  }],
  fileName: {
    type: String // Nombre del archivo original si se subió
  },
  fileSize: {
    type: Number // Tamaño en bytes
  },
  mimeType: {
    type: String // Tipo MIME del archivo
  },
  // Información para RAG
  chunks: [{
    content: String,
    embedding: [Number], // Vector embedding para búsqueda semántica
    startIndex: Number,
    endIndex: Number
  }],
  metadata: {
    uploadedBy: String, // ID del admin que subió el documento
    source: String, // URL externa o descripción del origen
    version: String,
    language: {
      type: String,
      default: 'es'
    }
  },
  isActive: {
    type: Boolean,
    default: true
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

// Índices para optimizar búsquedas
documentSchema.index({ type: 1, category: 1 });
documentSchema.index({ title: 'text', content: 'text', tags: 'text' });
documentSchema.index({ isActive: 1 });
documentSchema.index({ vendorId: 1, isActive: 1 });

const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);

export default Document;
