const express = require('express');
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getMyRequests,
  getPendingRequests,
  getRequestById,
  updateRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
  addComment,
  getRequestStats,
  deleteRequest
} = require('../controllers/requestController');
const { protect, isManagerOrAdmin, isAdmin } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Employee routes
router.post('/', createRequest);
router.get('/my', getMyRequests);
router.get('/stats', getRequestStats);

// Manager/Admin routes
router.get('/', isManagerOrAdmin, getAllRequests);
router.get('/pending', isManagerOrAdmin, getPendingRequests);

// Specific request routes
router.get('/:id', getRequestById);
router.put('/:id', updateRequest);
router.put('/:id/approve', isManagerOrAdmin, approveRequest);
router.put('/:id/reject', isManagerOrAdmin, rejectRequest);
router.put('/:id/cancel', cancelRequest);
router.post('/:id/comments', addComment);

// Admin only
router.delete('/:id', isAdmin, deleteRequest);

module.exports = router;
