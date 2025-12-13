const Invoice = require('../models/Invoice');
const Order = require('../models/Order');

// @desc    Hämta alla fakturor
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
  try {
    const { status, startDate, endDate, customer } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (customer) {
      query['customer.name'] = new RegExp(customer, 'i');
    }
    
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query)
      .populate('order')
      .populate('createdBy', 'name email')
      .sort({ invoiceDate: -1 });

    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av fakturor',
      error: error.message
    });
  }
};

// @desc    Hämta en faktura
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('order')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Faktura hittades inte'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av faktura',
      error: error.message
    });
  }
};

// @desc    Skapa faktura från order
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res) => {
  try {
    const { orderId, vatRate, notes } = req.body;

    // Hämta order
    const order = await Order.findById(orderId).populate('orderLines.article');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order hittades inte'
      });
    }

    // Kontrollera att order är plockad
    if (order.status !== 'picked') {
      return res.status(400).json({
        success: false,
        message: 'Order måste vara plockad innan faktura kan skapas'
      });
    }

    // Kontrollera om faktura redan finns för denna order
    const existingInvoice = await Invoice.findOne({ order: orderId });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Faktura finns redan för denna order'
      });
    }

    // Skapa fakturarader från orderrader
    const invoiceLines = order.orderLines.map(line => ({
      articleNumber: line.articleNumber,
      articleName: line.articleName,
      quantity: line.quantity,
      price: line.price,
      total: line.quantity * line.price
    }));

    // Skapa faktura
    const invoice = await Invoice.create({
      order: order._id,
      orderNumber: order.orderNumber,
      customer: order.customer,
      invoiceLines,
      vatRate: vatRate || 25,
      notes,
      createdBy: req.user._id
    });

    // Uppdatera orderstatus
    order.status = 'invoiced';
    await order.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('order')
      .populate('createdBy', 'name email');

    // Emit socket event
    if (req.io) {
      req.io.emit('invoice:created', populatedInvoice);
      req.io.emit('order:updated', order);
    }

    res.status(201).json({
      success: true,
      data: populatedInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid skapande av faktura',
      error: error.message
    });
  }
};

// @desc    Uppdatera faktura
// @route   PUT /api/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res) => {
  try {
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Faktura hittades inte'
      });
    }

    // Tillåt inte uppdatering av betalda fakturor
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Kan inte uppdatera betald faktura'
      });
    }

    invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('order');

    // Emit socket event
    if (req.io) {
      req.io.emit('invoice:updated', invoice);
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid uppdatering av faktura',
      error: error.message
    });
  }
};

// @desc    Uppdatera fakturastatus
// @route   PUT /api/invoices/:id/status
// @access  Private
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status, paidAmount, paidDate, paymentReference } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Faktura hittades inte'
      });
    }

    invoice.status = status;

    if (status === 'sent' && !invoice.sentDate) {
      invoice.sentDate = new Date();
    }

    if (status === 'paid') {
      invoice.paidDate = paidDate || new Date();
      invoice.paidAmount = paidAmount || invoice.totalAmount;
      if (paymentReference) {
        invoice.paymentReference = paymentReference;
      }
    }

    await invoice.save();

    // Emit socket event
    if (req.io) {
      req.io.emit('invoice:updated', invoice);
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid uppdatering av fakturastatus',
      error: error.message
    });
  }
};

// @desc    Ta bort faktura
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Faktura hittades inte'
      });
    }

    // Tillåt inte borttagning av skickade eller betalda fakturor
    if (invoice.status === 'sent' || invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Kan inte ta bort skickade eller betalda fakturor'
      });
    }

    // Uppdatera kopplad order tillbaka till picked
    if (invoice.order) {
      await Order.findByIdAndUpdate(invoice.order, { status: 'picked' });
    }

    await invoice.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid borttagning av faktura',
      error: error.message
    });
  }
};

// @desc    Hämta förfallna fakturor
// @route   GET /api/invoices/overdue
// @access  Private
exports.getOverdueInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      dueDate: { $lt: new Date() },
      status: { $nin: ['paid', 'cancelled'] }
    })
    .populate('order')
    .sort({ dueDate: 1 });

    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av förfallna fakturor',
      error: error.message
    });
  }
};

// @desc    Hämta fakturastatistik
// @route   GET /api/invoices/statistics
// @access  Private
exports.getInvoiceStatistics = async (req, res) => {
  try {
    const totalInvoices = await Invoice.countDocuments();
    const unpaidInvoices = await Invoice.countDocuments({ 
      status: { $nin: ['paid', 'cancelled'] } 
    });
    const overdueInvoices = await Invoice.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $nin: ['paid', 'cancelled'] }
    });

    const totalValue = await Invoice.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const unpaidValue = await Invoice.aggregate([
      { $match: { status: { $nin: ['paid', 'cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalInvoices,
        unpaidInvoices,
        overdueInvoices,
        totalValue: totalValue[0]?.total || 0,
        unpaidValue: unpaidValue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av statistik',
      error: error.message
    });
  }
};