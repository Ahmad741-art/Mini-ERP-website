const Order = require('../models/Order');
const Article = require('../models/Article');
const StockMovement = require('../models/StockMovement');

// @desc    Hämta alla ordrar
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    const { status, customer, startDate, endDate } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (customer) {
      query['customer.name'] = new RegExp(customer, 'i');
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('orderLines.article', 'articleNumber name')
      .populate('createdBy', 'name email')
      .populate('pickedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av ordrar',
      error: error.message
    });
  }
};

// @desc    Hämta en order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderLines.article')
      .populate('createdBy', 'name email')
      .populate('pickedBy', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order hittades inte'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av order',
      error: error.message
    });
  }
};

// @desc    Skapa ny order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { customer, orderLines, notes } = req.body;

    // Validera och hämta artiklar
    const enrichedOrderLines = await Promise.all(
      orderLines.map(async (line) => {
        const article = await Article.findById(line.article);
        if (!article) {
          throw new Error(`Artikel med ID ${line.article} hittades inte`);
        }
        
        return {
          article: article._id,
          articleNumber: article.articleNumber,
          articleName: article.name,
          quantity: line.quantity,
          price: line.price || article.price,
          pickedQuantity: 0,
          isPicked: false
        };
      })
    );

    // Skapa order
    const order = await Order.create({
      customer,
      orderLines: enrichedOrderLines,
      notes,
      createdBy: req.user._id,
      status: 'not_ready'
    });

    // Kontrollera om order kan sättas till ready_to_pick
    await checkAndUpdateOrderStatus(order._id);

    const populatedOrder = await Order.findById(order._id)
      .populate('orderLines.article')
      .populate('createdBy', 'name email');

    // Emit socket event
    if (req.io) {
      req.io.emit('order:created', populatedOrder);
    }

    res.status(201).json({
      success: true,
      data: populatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid skapande av order',
      error: error.message
    });
  }
};

// @desc    Uppdatera order
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order hittades inte'
      });
    }

    // Tillåt inte uppdatering av plockade eller fakturerade ordrar
    if (order.status === 'picked' || order.status === 'invoiced') {
      return res.status(400).json({
        success: false,
        message: 'Kan inte uppdatera plockade eller fakturerade ordrar'
      });
    }

    order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('orderLines.article');

    // Emit socket event
    if (req.io) {
      req.io.emit('order:updated', order);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid uppdatering av order',
      error: error.message
    });
  }
};

// @desc    Ta bort order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order hittades inte'
      });
    }

    // Tillåt inte borttagning av fakturerade ordrar
    if (order.status === 'invoiced') {
      return res.status(400).json({
        success: false,
        message: 'Kan inte ta bort fakturerade ordrar'
      });
    }

    // Frigör reserverat lager om order är ready_to_pick eller picked
    if (order.status === 'ready_to_pick' || order.status === 'picked') {
      for (const line of order.orderLines) {
        await StockMovement.createMovement({
          article: line.article,
          movementType: 'release',
          quantity: line.quantity,
          reference: 'order',
          referenceId: order._id,
          referenceNumber: order.orderNumber,
          referenceModel: 'Order',
          notes: `Frisläppning vid borttagning av order ${order.orderNumber}`,
          user: req.user._id
        });
      }
    }

    await order.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid borttagning av order',
      error: error.message
    });
  }
};

// @desc    Uppdatera orderstatus
// @route   PUT /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order hittades inte'
      });
    }

    const oldStatus = order.status;
    order.status = status;

    // Hantera statusövergångar
    if (status === 'ready_to_pick' && oldStatus === 'not_ready') {
      // Reservera lager
      for (const line of order.orderLines) {
        await StockMovement.createMovement({
          article: line.article,
          movementType: 'reservation',
          quantity: line.quantity,
          reference: 'order',
          referenceId: order._id,
          referenceNumber: order.orderNumber,
          referenceModel: 'Order',
          notes: `Reservation för order ${order.orderNumber}`,
          user: req.user._id
        });
      }
    }

    if (status === 'cancelled') {
      // Frigör reserverat lager
      if (oldStatus === 'ready_to_pick' || oldStatus === 'picked') {
        for (const line of order.orderLines) {
          await StockMovement.createMovement({
            article: line.article,
            movementType: 'release',
            quantity: line.quantity,
            reference: 'order',
            referenceId: order._id,
            referenceNumber: order.orderNumber,
            referenceModel: 'Order',
            notes: `Frisläppning vid avbrytning av order ${order.orderNumber}`,
            user: req.user._id
          });
        }
      }
    }

    await order.save();

    // Emit socket event
    if (req.io) {
      req.io.emit('order:updated', order);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid uppdatering av orderstatus',
      error: error.message
    });
  }
};

// Hjälpfunktion för att kontrollera och uppdatera orderstatus
async function checkAndUpdateOrderStatus(orderId) {
  const order = await Order.findById(orderId).populate('orderLines.article');
  
  if (!order || order.status !== 'not_ready') {
    return;
  }

  // Kontrollera om alla artiklar finns i lager
  let canPick = true;
  for (const line of order.orderLines) {
    const article = await Article.findById(line.article);
    if (!article || article.availableQuantity < line.quantity) {
      canPick = false;
      break;
    }
  }

  if (canPick) {
    order.status = 'ready_to_pick';
    await order.save();
  }
}

module.exports.checkAndUpdateOrderStatus = checkAndUpdateOrderStatus;