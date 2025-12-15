const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.route('/')
  .get(protect, getOrders)
  .post(protect, createOrder);

router.route('/:id')
  .get(protect, getOrder)
  .put(protect, updateOrder)
  .delete(protect, authorize('admin'), deleteOrder);

router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;