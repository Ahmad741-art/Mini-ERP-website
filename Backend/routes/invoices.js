const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getOverdueInvoices,
  getInvoiceStatistics
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const { checkPermission, authorize } = require('../middleware/roleCheck');

router.get('/overdue', protect, checkPermission('view_invoices'), getOverdueInvoices);
router.get('/statistics', protect, checkPermission('view_invoices'), getInvoiceStatistics);

router.route('/')
  .get(protect, checkPermission('view_invoices'), getInvoices)
  .post(protect, checkPermission('create_invoices'), createInvoice);

router.route('/:id')
  .get(protect, checkPermission('view_invoices'), getInvoice)
  .put(protect, checkPermission('update_invoices'), updateInvoice)
  .delete(protect, authorize('admin'), deleteInvoice);

router.put('/:id/status', protect, checkPermission('update_invoices'), updateInvoiceStatus);

module.exports = router;