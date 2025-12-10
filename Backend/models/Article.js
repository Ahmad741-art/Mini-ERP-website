const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  articleNumber: {
    type: String,
    required: [true, 'Artikelnummer krävs'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Artikelnamn krävs'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Pris krävs'],
    min: 0
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  stockQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  unit: {
    type: String,
    default: 'st',
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual för tillgängligt saldo
articleSchema.virtual('availableQuantity').get(function() {
  return this.stockQuantity - this.reservedQuantity;
});

// Virtual för att kontrollera låg lagernivå
articleSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity <= this.minStockLevel;
});

// Index för snabbare sökning
articleSchema.index({ articleNumber: 1 });
articleSchema.index({ name: 'text', description: 'text' });
articleSchema.index({ category: 1 });

// Inkludera virtuals i JSON output
articleSchema.set('toJSON', { virtuals: true });
articleSchema.set('toObject', { virtuals: true });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;