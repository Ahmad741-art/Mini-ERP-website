const express = require('express');
const router = express.Router();
const {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getLowStockArticles,
  getCategories
} = require('../controllers/articleController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/low-stock', protect, getLowStockArticles);
router.get('/categories', protect, getCategories);

router.route('/')
  .get(protect, getArticles)
  .post(protect, authorize('admin'), createArticle);

router.route('/:id')
  .get(protect, getArticle)
  .put(protect, authorize('admin'), updateArticle)
  .delete(protect, authorize('admin'), deleteArticle);

module.exports = router;