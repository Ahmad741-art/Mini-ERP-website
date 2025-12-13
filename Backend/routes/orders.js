const express = require('express');
const router = express.Router();
const {
  getStockOverview,
  getStockMovements,
  createStockMovement,
  getPickingLines,
  completePickingLine,
  getStockStatistics
} = require('../controllers/stockController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/roleCheck');

router.get('/', protect, checkPermission('view_stock'), getStockOverview);
router.get('/statistics', protect, checkPermission('view_stock'), getStockStatistics);
router.get('/movements', protect, checkPermission('view_stock'), getStockMovements);
router.post('/movement', protect, checkPermission('update_stock'), createStockMovement);

// Plockningsrelaterade routes
router.get('/picking', protect, checkPermission('pick_orders'), getPickingLines);
router.put('/picking/:orderId/:lineId', protect, checkPermission('pick_orders'), completePickingLine);

module.exports = router;