const Article = require('../models/Article');

// @desc    Hämta alla artiklar
// @route   GET /api/articles
// @access  Private
exports.getArticles = async (req, res) => {
  try {
    const { category, lowStock, search, active } = req.query;
    
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (active !== undefined) {
      query.active = active === 'true';
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
      message: 'Fel vid hämtning av artiklar',
      error: error.message
    });
  }
};

// @desc    Hämta en artikel
// @route   GET /api/articles/:id
// @access  Private
exports.getArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel hittades inte'
      });
    }

    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av artikel',
      error: error.message
    });
  }
};

// @desc    Skapa ny artikel
// @route   POST /api/articles
// @access  Private/Admin
exports.createArticle = async (req, res) => {
  try {
    const article = await Article.create(req.body);

    // Emit socket event
    if (req.io) {
      req.io.emit('article:created', article);
    }

    res.status(201).json({
      success: true,
      data: article
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Artikelnummer finns redan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Fel vid skapande av artikel',
      error: error.message
    });
  }
};

// @desc    Uppdatera artikel
// @route   PUT /api/articles/:id
// @access  Private/Admin
exports.updateArticle = async (req, res) => {
  try {
    let article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel hittades inte'
      });
    }

    // Tillåt inte direkt uppdatering av stockQuantity och reservedQuantity
    // dessa ska uppdateras via StockMovement
    const { stockQuantity, reservedQuantity, ...updateData } = req.body;

    article = await Article.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    // Emit socket event
    if (req.io) {
      req.io.emit('article:updated', article);
    }

    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid uppdatering av artikel',
      error: error.message
    });
  }
};

// @desc    Ta bort artikel
// @route   DELETE /api/articles/:id
// @access  Private/Admin
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel hittades inte'
      });
    }

    // Kontrollera om artikel används i ordrar
    const Order = require('../models/Order');
    const ordersWithArticle = await Order.findOne({
      'orderLines.article': article._id,
      status: { $nin: ['cancelled'] }
    });

    if (ordersWithArticle) {
      return res.status(400).json({
        success: false,
        message: 'Kan inte ta bort artikel som används i aktiva ordrar'
      });
    }

    // Soft delete - sätt artikel som inaktiv istället
    article.active = false;
    await article.save();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid borttagning av artikel',
      error: error.message
    });
  }
};

// @desc    Hämta artiklar med lågt lager
// @route   GET /api/articles/low-stock
// @access  Private
exports.getLowStockArticles = async (req, res) => {
  try {
    const articles = await Article.find({
      $expr: { $lte: ['$stockQuantity', '$minStockLevel'] },
      active: true
    }).sort({ stockQuantity: 1 });

    res.json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av artiklar med lågt lager',
      error: error.message
    });
  }
};

// @desc    Hämta kategorier
// @route   GET /api/articles/categories
// @access  Private
exports.getCategories = async (req, res) => {
  try {
    const categories = await Article.distinct('category');

    res.json({
      success: true,
      data: categories.filter(cat => cat) // Filtrera bort null/undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av kategorier',
      error: error.message
    });
  }
};