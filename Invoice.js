const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNumber: String,
  customer: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      postalCode: String,
      city: String,
      country: String
    }
  },
  invoiceLines: [{
    articleNumber: String,
    articleName: String,
    quantity: Number,
    price: Number,
    total: Number
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  vatAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  vatRate: {
    type: Number,
    default: 25,
    min: 0,
    max: 100
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  sentDate: Date,
  paidDate: Date,
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentReference: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generera fakturanummer automatiskt
invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    
    // Hitta senaste fakturanummer för detta år
    const lastInvoice = await this.constructor.findOne({
      invoiceNumber: new RegExp(`^${year}`)
    }).sort({ invoiceNumber: -1 });
    
    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.slice(4));
      sequence = lastSequence + 1;
    }
    
    this.invoiceNumber = `${year}${String(sequence).padStart(5, '0')}`;
  }
  next();
});

// Beräkna totaler
invoiceSchema.pre('save', function(next) {
  if (this.invoiceLines && this.invoiceLines.length > 0) {
    this.subtotal = this.invoiceLines.reduce((sum, line) => {
      line.total = line.quantity * line.price;
      return sum + line.total;
    }, 0);
    
    this.vatAmount = this.subtotal * (this.vatRate / 100);
    this.totalAmount = this.subtotal + this.vatAmount;
  }
  
  // Sätt förfallodatum om inte satt (30 dagar från fakturadatum)
  if (!this.dueDate) {
    this.dueDate = new Date(this.invoiceDate);
    this.dueDate.setDate(this.dueDate.getDate() + 30);
  }
  
  next();
});

// Virtual för att kontrollera om förfallen
invoiceSchema.virtual('isOverdue').get(function() {
  if (this.status === 'paid' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual för återstående belopp
invoiceSchema.virtual('remainingAmount').get(function() {
  return this.totalAmount - this.paidAmount;
});

// Index
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ order: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ invoiceDate: -1 });

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;