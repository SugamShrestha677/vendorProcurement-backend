const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');
const { protect, isAdmin, isManagerOrAdmin } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// User profile routes
router.put('/profile', updateProfile);

// Admin/Manager routes
router.get('/', isManagerOrAdmin, getAllUsers);
router.get('/stats', isAdmin, getUserStats);
router.get('/:id', isManagerOrAdmin, getUserById);
router.put('/:id', isAdmin, updateUser);
router.delete('/:id', isAdmin, deleteUser);

module.exports = router;
