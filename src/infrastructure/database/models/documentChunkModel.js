import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  chunkText: {
    type: String,
    required: true
  },
  chunkIndex: {
    type: Number,
    required: true
  },
  tokenCount: {
    type: Number,
    required: true
  },
  startIndex: {
    type: Number,
    required: true
  },
  endIndex: {
    type: Number,
    required: true
  },
  lastIndexed: {
    type: Date,
    default: null,
    index: true
  },
  metadata: {
    pageNumber: Number,
    section: String,
    headings: [String]
  }
}, {
  timestamps: true
});

// Índices para optimizar búsquedas
documentChunkSchema.index({ documentId: 1, chunkIndex: 1 });
documentChunkSchema.index({ tokenCount: 1 });
documentChunkSchema.index({ 'metadata.pageNumber': 1 });

// Índice de texto para búsqueda
documentChunkSchema.index({
  chunkText: 'text'
}, {
  weights: { chunkText: 10 }
});

const DocumentChunk = mongoose.models.DocumentChunk || mongoose.model('DocumentChunk', documentChunkSchema);

export default DocumentChunk;
