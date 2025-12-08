const StockMovement = require('../models/StockMovement');
const Article = require('../models/Article');
const Order = require('../models/Order');

// @desc    Hämta lagervy
// @route   GET /api/stock
// @access  Private
exports.getStockOverview = async (req, res) => {
  try {
    const articles = await Article.find({ active: true })
      .select('articleNumber name stockQuantity reservedQuantity minStockLevel unit category')
      .sort({ articleNumber: 1 });

    const stockData = articles.map(article => ({
      id: article._id,
      articleNumber: article.articleNumber,
      name: article.name,
      stockQuantity: article.stockQuantity,
      reservedQuantity: article.reservedQuantity,
      availableQuantity: article.availableQuantity,
      minStockLevel: article.minStockLevel,
      isLowStock: article.isLowStock,
      unit: article.unit,
      category: article.category
    }));

    res.json({
      success: true,
      count: stockData.length,
      data: stockData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av lagervy',
      error: error.message
    });
  }
};

// @desc    Hämta lagerrörelser
// @route   GET /api/stock/movements
// @access  Private
exports.getStockMovements = async (req, res) => {
  try {
    const { article, startDate, endDate, movementType } = req.query;
    
    let query = {};
    
    if (article) {
      query.article = article;
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
      .populate('user', 'name')
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
      reference,
      notes,
      user: req.user._id
    });

    const populatedMovement = await StockMovement.findById(movement._id)
      .populate('article', 'articleNumber name');

    // Hämta uppdaterad artikel
    const updatedArticle = await Article.findById(article);

    // Emit socket event
    if (req.io) {
      req.io.emit('stock:updated', {
        movement: populatedMovement,
        article: updatedArticle
      });

      // Kolla om lågt lager
      if (updatedArticle.isLowStock) {
        req.io.emit('stock:low-warning', updatedArticle);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedMovement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
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
    .populate('orderLines.article', 'articleNumber name stockQuantity')
    .populate('customer')
    .sort({ createdAt: 1 });

    // Skapa plockrader från ordrar
    const pickingLines = [];
    
    for (const order of orders) {
      for (const line of order.orderLines) {
        if (!line.isPicked) {
          pickingLines.push({
            orderId: order._id,
            orderNumber: order.orderNumber,
            customer: order.customer.name,
            lineId: line._id,
            article: line.article,
            articleNumber: line.articleNumber,
            articleName: line.articleName,
            quantity: line.quantity,
            pickedQuantity: line.pickedQuantity,
            location: line.article?.location || 'Okänd',
            priority: order.priority || 'normal'
          });
        }
      }
    }

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

// @desc    Bocka av plockrad
// @route   PUT /api/stock/picking/:orderId/:lineId
// @access  Private
exports.completePickingLine = async (req, res) => {
  try {
    const { orderId, lineId } = req.params;
    const { quantity } = req.body;

    const order = await Order.findById(orderId);
    
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

    // Uppdatera plockad kvantitet
    line.pickedQuantity = quantity || line.quantity;
    line.isPicked = line.pickedQuantity >= line.quantity;

    // Skapa lagerrörelse (ta från lager)
    if (line.isPicked) {
      await StockMovement.createMovement({
        article: line.article,
        movementType: 'out',
        quantity: line.quantity,
        reference: 'sale',
        referenceId: order._id,
        referenceNumber: order.orderNumber,
        referenceModel: 'Order',
        notes: `Plockning för order ${order.orderNumber}`,
        user: req.user._id
      });

      // Frigör reservation
      await StockMovement.createMovement({
        article: line.article,
        movementType: 'release',
        quantity: line.quantity,
        reference: 'order',
        referenceId: order._id,
        referenceNumber: order.orderNumber,
        referenceModel: 'Order',
        notes: `Frisläppning efter plockning för order ${order.orderNumber}`,
        user: req.user._id
      });
    }

    // Kolla om alla rader är plockade
    const allPicked = order.orderLines.every(l => l.isPicked);
    
    if (allPicked) {
      order.status = 'picked';
      order.pickedBy = req.user._id;
      order.pickedAt = new Date();
    }

    await order.save();

    // Emit socket event
    if (req.io) {
      req.io.emit('picking:completed', {
        order,
        line,
        allPicked
      });
    }

    res.json({
      success: true,
      data: {
        order,
        line,
        allPicked
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid bockning av plockrad',
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
    
    const totalStockValue = await Article.aggregate([
      { $match: { active: true } },
      { 
        $group: { 
          _id: null, 
          value: { $sum: { $multiply: ['$stockQuantity', '$cost'] } }
        }
      }
    ]);

    const recentMovements = await StockMovement.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        totalArticles,
        lowStockArticles,
        totalStockValue: totalStockValue[0]?.value || 0,
        recentMovements24h: recentMovements
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