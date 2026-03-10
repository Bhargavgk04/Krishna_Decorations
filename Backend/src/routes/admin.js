const express = require('express');
const AdminController = require('../controllers/adminController');
const BookingController = require('../controllers/bookingController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/security');
const {
  validateUserLogin,
  validatePasswordChange,
  validateProfileUpdate,
  validateAdminRegistration,
  validateAdminUpdate,
  validateObjectId,
  validateQueryParams,
  sanitizeInput,
} = require('../utils/validators');

const router = express.Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

/**
 * @route POST /api/admin/login
 * @desc Admin login
 * @access Public
 */
router.post('/login', authRateLimit, validateUserLogin, AdminController.login);

// All routes below require authentication
router.use(authenticate);

/**
 * @route GET /api/admin/dashboard
 * @desc Get admin dashboard data
 * @access Private (Admin)
 */
router.get('/dashboard', authorizeAdmin(), AdminController.getDashboard);

/**
 * @route GET /api/admin/profile
 * @desc Get admin profile
 * @access Private (Admin)
 */
router.get('/profile', authorizeAdmin(), AdminController.getProfile);

/**
 * @route PUT /api/admin/profile
 * @desc Update admin profile
 * @access Private (Admin)
 */
router.put('/profile', authorizeAdmin(), validateProfileUpdate, AdminController.updateProfile);

/**
 * @route POST /api/admin/change-password
 * @desc Change admin password
 * @access Private (Admin)
 */
router.post('/change-password', authorizeAdmin(), validatePasswordChange, AdminController.changePassword);

/**
 * @route GET /api/admin/activity-log
 * @desc Get admin activity log
 * @access Private (Admin)
 */
router.get('/activity-log', authorizeAdmin(), validateQueryParams('pagination'), AdminController.getActivityLog);

// Booking management routes
/**
 * @route GET /api/admin/bookings
 * @desc Get all bookings with filtering
 * @access Private (Admin)
 */
router.get('/bookings', authorizeAdmin(), validateQueryParams('bookingQuery'), BookingController.getAllBookings);

/**
 * @route PUT /api/admin/bookings/:bookingId/status
 * @desc Update booking status
 * @access Private (Admin)
 */
router.put('/bookings/:bookingId/status', 
  authorizeAdmin(['manage_bookings']), 
  validateObjectId('bookingId'),
  BookingController.updateBookingStatus
);

/**
 * @route GET /api/admin/bookings/statistics
 * @desc Get booking statistics
 * @access Private (Admin)
 */
router.get('/bookings/statistics', 
  authorizeAdmin(['view_statistics']), 
  validateQueryParams('dateRange'),
  BookingController.getBookingStatistics
);

/**
 * @route GET /api/admin/bookings/upcoming
 * @desc Get upcoming bookings
 * @access Private (Admin)
 */
router.get('/bookings/upcoming', authorizeAdmin(), BookingController.getUpcomingBookings);

/**
 * @route POST /api/admin/bookings/send-reminders
 * @desc Send event reminders
 * @access Private (Admin with notification permissions)
 */
router.post('/bookings/send-reminders', 
  authorizeAdmin(['send_notifications']), 
  BookingController.sendEventReminders
);

// Admin management routes (Super Admin and Manager only)
/**
 * @route GET /api/admin/admins
 * @desc Get all admins
 * @access Private (Super Admin)
 */
router.get('/admins', 
  authorizeAdmin(['manage_admins']), 
  validateQueryParams('pagination'),
  AdminController.getAllAdmins
);

/**
 * @route POST /api/admin/admins
 * @desc Create new admin
 * @access Private (Super Admin)
 */
router.post('/admins', 
  authorizeAdmin(['manage_admins']), 
  validateAdminRegistration,
  AdminController.createAdmin
);

/**
 * @route PUT /api/admin/admins/:adminId
 * @desc Update admin
 * @access Private (Super Admin/Manager)
 */
router.put('/admins/:adminId', 
  authorizeAdmin(['manage_admins']), 
  validateObjectId('adminId'),
  validateAdminUpdate,
  AdminController.updateAdmin
);

/**
 * @route DELETE /api/admin/admins/:adminId
 * @desc Deactivate admin
 * @access Private (Super Admin)
 */
router.delete('/admins/:adminId', 
  authorizeAdmin(['manage_admins']), 
  validateObjectId('adminId'),
  AdminController.deactivateAdmin
);

module.exports = router;