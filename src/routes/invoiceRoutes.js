const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getAllInvoices,
  getMyInvoices,
  getPendingInvoices,
  getInvoiceById,
  updateInvoice,
  approveInvoice,
  rejectInvoice,
  markAsPaid,
  cancelInvoice,
  getInvoiceStats,
  deleteInvoice
} = require('../controllers/invoiceController');
const { protect, isManagerOrAdmin, isVendor, isAdmin } = require('../middleware/authMiddleware');

console.log({
  protect,
  isVendor,
  isManagerOrAdmin,
  isAdmin,
  createInvoice,
  getAllInvoices,
  getMyInvoices,
  getPendingInvoices,
  getInvoiceById,
  updateInvoice,
  approveInvoice,
  rejectInvoice,
  markAsPaid,
  cancelInvoice,
  getInvoiceStats,
  deleteInvoice
});

// All routes require authentication
router.use(protect);

// Vendor routes
router.post('/', isVendor, createInvoice);
router.get('/my', isVendor, getMyInvoices);

// Stats route (available to all authenticated users)
router.get('/stats', getInvoiceStats);

// Manager/Admin routes
router.get('/', isManagerOrAdmin, getAllInvoices);
router.get('/pending', isManagerOrAdmin, getPendingInvoices);

// Specific invoice routes
router.get('/:id', getInvoiceById);
router.put('/:id', isVendor, updateInvoice);
router.put('/:id/approve', isManagerOrAdmin, approveInvoice);
router.put('/:id/reject', isManagerOrAdmin, rejectInvoice);
router.put('/:id/pay', isManagerOrAdmin, markAsPaid);
router.put('/:id/cancel', isVendor, cancelInvoice);

// Admin only
router.delete('/:id', isAdmin, deleteInvoice);

module.exports = router;
