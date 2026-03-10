const express = require('express');
const BookingController = require('../controllers/bookingController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const { validateBookingRequest } = require('../utils/validators');
const { uploadMultiple } = require('../middleware/upload');

const router = express.Router();

// Public routes
/**
 * @route GET /api/bookings/availability
 * @desc Check date availability
 * @access Public
 */
router.get('/availability', BookingController.checkAvailability);

// Protected user routes
/**
 * @route POST /api/bookings
 * @desc Create a new booking
 * @access Private (User)
 */
router.post(
  '/',
  authenticate,
  ...uploadMultiple('referenceImages', 5, 'references'),
  validateBookingRequest('create'),
  BookingController.createBooking,
);

/**
 * @route GET /api/bookings/my-bookings
 * @desc Get current user's bookings
 * @access Private (User)
 */
router.get('/my-bookings', authenticate, BookingController.getUserBookings);

/**
 * @route GET /api/bookings/:bookingId
 * @desc Get booking by ID
 * @access Private (User/Admin)
 */
router.get('/:bookingId', authenticate, BookingController.getBooking);

/**
 * @route PUT /api/bookings/:bookingId
 * @desc Update booking
 * @access Private (User - only pending bookings)
 */
router.put(
  '/:bookingId',
  authenticate,
  ...uploadMultiple('referenceImages', 5, 'references'),
  validateBookingRequest('update'),
  BookingController.updateBooking,
);

/**
 * @route DELETE /api/bookings/:bookingId
 * @desc Cancel booking
 * @access Private (User)
 */
router.delete('/:bookingId', authenticate, BookingController.cancelBooking);

// Admin-only routes
/**
 * @route GET /api/bookings/admin/all
 * @desc Get all bookings with filtering
 * @access Private (Admin)
 */
router.get('/admin/all', authenticate, authorizeAdmin(), BookingController.getAllBookings);

/**
 * @route PUT /api/bookings/admin/:bookingId/status
 * @desc Update booking status
 * @access Private (Admin)
 */
router.put(
  '/admin/:bookingId/status',
  authenticate,
  authorizeAdmin(),
  validateBookingRequest('statusUpdate'),
  BookingController.updateBookingStatus,
);

/**
 * @route GET /api/bookings/admin/statistics
 * @desc Get booking statistics
 * @access Private (Admin)
 */
router.get('/admin/statistics', authenticate, authorizeAdmin(), BookingController.getBookingStatistics);

/**
 * @route GET /api/bookings/admin/upcoming
 * @desc Get upcoming bookings
 * @access Private (Admin)
 */
router.get('/admin/upcoming', authenticate, authorizeAdmin(), BookingController.getUpcomingBookings);

/**
 * @route POST /api/bookings/admin/send-reminders
 * @desc Send event reminders
 * @access Private (Admin)
 */
router.post(
  '/admin/send-reminders',
  authenticate,
  authorizeAdmin(['send_notifications']),
  BookingController.sendEventReminders,
);

module.exports = router;