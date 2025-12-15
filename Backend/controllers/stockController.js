const Article = require('../models/Article');
const StockMovement = require('../models/StockMovement');
const Order = require('../models/Order');

// @desc    Hämta lageröversikt
// @route   GET /api/stock
// @access  Private
exports.getStockOverview = async (req, res) => {
  try {
    const { category, lowStock, search } = req.query;
    
    let query = { active: true };
    
    if (category) {
      query.category = category;
    }
    
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stockQuantity', '$minStockLevel'] };
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const articles = await Article.find(query).sort({ articleNumber: 1 });

    res.json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av lageröversikt',
      error: error.message
    });
  }
};

// @desc    Hämta lagerrörelser
// @route   GET /api/stock/movements
// @access  Private
exports.getStockMovements = async (req, res) => {
  try {
    const { articleId, movementType, startDate, endDate } = req.query;
    
    let query = {};
    
    if (articleId) {
      query.article = articleId;
    }
    
    if (movementType) {
      query.movementType = movementType;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const movements = await StockMovement.find(query)
      .populate('article', 'articleNumber name')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: movements.length,
      data: movements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av lagerrörelser',
      error: error.message
    });
  }
};

// @desc    Skapa lagerrörelse
// @route   POST /api/stock/movement
// @access  Private
exports.createStockMovement = async (req, res) => {
  try {
    const { article, movementType, quantity, reference, notes } = req.body;

    const movement = await StockMovement.createMovement({
      article,
      movementType,
      quantity,
      reference: reference || 'adjustment',
      notes,
      user: req.user._id
    });

    const populatedMovement = await StockMovement.findById(movement._id)
      .populate('article', 'articleNumber name')
      .populate('user', 'name email');

    // Emit socket event
    if (req.io) {
      req.io.emit('stock:updated', populatedMovement);
    }

    res.status(201).json({
      success: true,
      data: populatedMovement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid skapande av lagerrörelse',
      error: error.message
    });
  }
};

// @desc    Hämta plockrader
// @route   GET /api/stock/picking
// @access  Private
exports.getPickingLines = async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: 'ready_to_pick' 
    })
    .populate('orderLines.article')
    .populate('createdBy', 'name email')
    .sort({ createdAt: 1 });

    // Flatten to picking lines
    const pickingLines = [];
    
    orders.forEach(order => {
      order.orderLines.forEach(line => {
        if (!line.isPicked) {
          pickingLines.push({
            orderId: order._id,
            orderNumber: order.orderNumber,
            customer: order.customer,
            lineId: line._id,
            article: line.article,
            articleNumber: line.articleNumber,
            articleName: line.articleName,
            quantity: line.quantity,
            pickedQuantity: line.pickedQuantity,
            isPicked: line.isPicked
          });
        }
      });
    });

    res.json({
      success: true,
      count: pickingLines.length,
      data: pickingLines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av plockrader',
      error: error.message
    });
  }
};

// @desc    Färdigställ plockrad
// @route   PUT /api/stock/picking/:orderId/:lineId
// @access  Private
exports.completePickingLine = async (req, res) => {
  try {
    const { orderId, lineId } = req.params;
    const { pickedQuantity } = req.body;

    const order = await Order.findById(orderId).populate('orderLines.article');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order hittades inte'
      });
    }

    const line = order.orderLines.id(lineId);

    if (!line) {
      return res.status(404).json({
        success: false,
        message: 'Orderrad hittades inte'
      });
    }

    if (line.isPicked) {
      return res.status(400).json({
        success: false,
        message: 'Orderrad är redan plockad'
      });
    }

    // Markera som plockad
    line.isPicked = true;
    line.pickedQuantity = pickedQuantity || line.quantity;

    // Skapa lagerrörelse för uttag
    await StockMovement.createMovement({
      article: line.article._id,
      movementType: 'out',
      quantity: line.pickedQuantity,
      reference: 'order',
      referenceId: order._id,
      referenceNumber: order.orderNumber,
      referenceModel: 'Order',
      notes: `Plockning av order ${order.orderNumber}`,
      user: req.user._id
    });

    // Kontrollera om alla rader är plockade
    const allPicked = order.orderLines.every(l => l.isPicked);
    if (allPicked) {
      order.status = 'picked';
      order.pickedBy = req.user._id;
      order.pickedAt = new Date();
    }

    await order.save();

    // Emit socket events
    if (req.io) {
      req.io.emit('picking:completed', { orderId, lineId });
      req.io.emit('order:updated', order);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid plockning',
      error: error.message
    });
  }
};

// @desc    Hämta lagerstatistik
// @route   GET /api/stock/statistics
// @access  Private
exports.getStockStatistics = async (req, res) => {
  try {
    const totalArticles = await Article.countDocuments({ active: true });
    const lowStockArticles = await Article.countDocuments({
      $expr: { $lte: ['$stockQuantity', '$minStockLevel'] },
      active: true
    });

    const stockValue = await Article.aggregate([
      { $match: { active: true } },
      { 
        $group: { 
          _id: null, 
          totalValue: { 
            $sum: { $multiply: ['$stockQuantity', '$price'] } 
          } 
        } 
      }
    ]);

    const totalReserved = await Article.aggregate([
      { $match: { active: true } },
      { $group: { _id: null, total: { $sum: '$reservedQuantity' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalArticles,
        lowStockArticles,
        stockValue: stockValue[0]?.totalValue || 0,
        totalReserved: totalReserved[0]?.total || 0
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