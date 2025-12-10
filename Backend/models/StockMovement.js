const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },
  movementType: {
    type: String,
    enum: ['in', 'out', 'adjustment', 'reservation', 'release'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  quantityBefore: {
    type: Number,
    required: true
  },
  quantityAfter: {
    type: Number,
    required: true
  },
  reference: {
    type: String,
    enum: ['purchase', 'sale', 'return', 'adjustment', 'order'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Order', 'Invoice', 'Purchase']
  },
  referenceNumber: String,
  notes: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index för snabbare queries
stockMovementSchema.index({ article: 1, createdAt: -1 });
stockMovementSchema.index({ movementType: 1 });
stockMovementSchema.index({ referenceId: 1 });
stockMovementSchema.index({ createdAt: -1 });

// Statisk metod för att skapa rörelse och uppdatera artikel
stockMovementSchema.statics.createMovement = async function(movementData) {
  const Article = mongoose.model('Article');
  const article = await Article.findById(movementData.article);
  
  if (!article) {
    throw new Error('Artikel hittades inte');
  }

  const quantityBefore = article.stockQuantity;
  let quantityAfter = quantityBefore;

  // Beräkna ny kvantitet baserat på typ av rörelse
  switch (movementData.movementType) {
    case 'in':
      quantityAfter = quantityBefore + movementData.quantity;
      break;
    case 'out':
      quantityAfter = quantityBefore - movementData.quantity;
      if (quantityAfter < 0) {
        throw new Error('Otillräckligt lager');
      }
      break;
    case 'adjustment':
      quantityAfter = movementData.quantity;
      break;
    case 'reservation':
      article.reservedQuantity += movementData.quantity;
      if (article.availableQuantity < 0) {
        throw new Error('Otillräckligt tillgängligt lager');
      }
      break;
    case 'release':
      article.reservedQuantity -= movementData.quantity;
      if (article.reservedQuantity < 0) {
        article.reservedQuantity = 0;
      }
      break;
  }

  // Skapa rörelse
  const movement = await this.create({
    ...movementData,
    quantityBefore,
    quantityAfter: movementData.movementType === 'reservation' || movementData.movementType === 'release' 
      ? quantityBefore 
      : quantityAfter
  });

  // Uppdatera artikel om inte reservation/release
  if (movementData.movementType !== 'reservation' && movementData.movementType !== 'release') {
    article.stockQuantity = quantityAfter;
  }
  
  await article.save();

  return movement;
};

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

module.exports = StockMovement;