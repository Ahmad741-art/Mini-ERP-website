const mongoose = require('mongoose');

const orderLineSchema = new mongoose.Schema({
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },
  articleNumber: String,
  articleName: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  pickedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  isPicked: {
    type: Boolean,
    default: false
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    address: {
      street: String,
      postalCode: String,
      city: String,
      country: { type: String, default: 'Sverige' }
    }
  },
  orderLines: [orderLineSchema],
  status: {
    type: String,
    enum: ['not_ready', 'ready_to_pick', 'picked', 'invoiced', 'cancelled'],
    default: 'not_ready'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: String,
  pickedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pickedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generera ordernummer automatiskt
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Hitta senaste ordernummer för denna månad
    const lastOrder = await this.constructor.findOne({
      orderNumber: new RegExp(`^ORD${year}${month}`)
    }).sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `ORD${year}${month}${String(sequence).padStart(4, '0')}`;
  }
  next();
});

// Beräkna totalbelopp
orderSchema.pre('save', function(next) {
  if (this.orderLines && this.orderLines.length > 0) {
    this.totalAmount = this.orderLines.reduce((sum, line) => {
      return sum + (line.quantity * line.price);
    }, 0);
  }
  next();
});

// Virtual för att kontrollera om alla rader är plockade
orderSchema.virtual('allLinesPicked').get(function() {
  return this.orderLines.every(line => line.isPicked);
});

// Index
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;