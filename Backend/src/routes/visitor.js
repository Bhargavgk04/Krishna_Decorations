const express = require('express');
const VisitorController = require('../controllers/visitorController');
const { authenticate, authorize, requireVerified } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

// All visitor routes require authentication and visitor role
router.use(authenticate);
router.use(authorize(USER_ROLES.VISITOR));

/**
 * @route   GET /api/visitor/dashboard
 * @desc    Get comprehensive visitor dashboard
 * @access  Private (Visitors only)
 */
router.get('/dashboard', 
  VisitorController.getDashboard
);

/**
 * @route   GET /api/visitor/bookings/history
 * @desc    Get visitor's booking history with advanced filtering
 * @access  Private (Visitors only)
 */
router.get('/bookings/history', 
  VisitorController.getBookingHistory
);

/**
 * @route   GET /api/visitor/bookings/action-required
 * @desc    Get bookings that need user attention
 * @access  Private (Visitors only)
 */
router.get('/bookings/action-required', 
  VisitorController.getActionRequiredBookings
);

/**
 * @route   GET /api/visitor/bookings/stats
 * @desc    Get visitor's booking statistics
 * @access  Private (Visitors only)
 */
router.get('/bookings/stats', 
  VisitorController.getBookingStats
);

/**
 * @route   PATCH /api/visitor/bookings/:id/quick-modify
 * @desc    Quick modification for specific booking fields
 * @access  Private (Verified visitors only)
 */
router.patch('/bookings/:id/quick-modify', 
  requireVerified,
  VisitorController.quickModifyBooking
);

/**
 * @route   GET /api/visitor/bookings/:id/modification-suggestions
 * @desc    Get modification suggestions based on admin comments
 * @access  Private (Visitors only)
 */
router.get('/bookings/:id/modification-suggestions', 
  VisitorController.getModificationSuggestions
);

module.exports = router;