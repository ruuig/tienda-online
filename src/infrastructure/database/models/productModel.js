import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  brand: {
    type: String,
    required: true,
    index: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  offerPrice: {
    type: Number,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  specifications: mongoose.Schema.Types.Mixed,
  features: [String],
  tags: [String],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  weight: Number, // en gramos
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  warranty: {
    type: String,
    default: '1 año'
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
productSchema.index({ vendorId: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1, isFeatured: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ price: 1, isActive: 1 });
productSchema.index({ offerPrice: 1, isActive: 1 });
productSchema.index({ stock: 1, isActive: 1 });

// Índice de texto para búsqueda
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,
    brand: 5,
    description: 3,
    tags: 8
  }
});

// Índice compuesto para búsquedas frecuentes
productSchema.index({ vendorId: 1, category: 1, isActive: 1, stock: 1 });

// Middleware para generar slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  this.updatedAt = new Date();
  next();
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
