const express = require('express');
const {
  register,
  login,
  getMe,
  logout,
  getLoginHistory
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/login-history', protect, authorize('admin'), getLoginHistory);

module.exports = router; 