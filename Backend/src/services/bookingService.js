const Booking = require('../models/Booking');
const User = require('../models/User');
const Admin = require('../models/Admin');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');
const { BOOKING_STATUS, ERROR_CODES } = require('../config/constants');
const { calculatePagination, isFutureDate } = require('../utils/helpers');
const logger = require('../utils/logger');

class BookingService {
  /**
   * Create new booking
   * @param {Object} bookingData - Booking data
   * @param {string} userId - User ID creating the booking
   * @returns {Object} Created booking
   */
  static async createBooking(bookingData, userId) {
    try {
      // Verify user exists and is active
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        throw this.createBookingError('User not found or inactive', 'USER_NOT_FOUND', 404);
      }

      // Validate event date is in the future
      if (!isFutureDate(bookingData.eventDate)) {
        throw this.createBookingError('Event date must be in the future', 'INVALID_DATE', 400);
      }

      // Check availability for the requested date
      const availability = await Booking.checkAvailability(new Date(bookingData.eventDate));
      if (!availability.available) {
        throw this.createBookingError('Selected date is not available', 'DATE_NOT_AVAILABLE', 409);
      }

      // Create booking with pending status
      const booking = new Booking({
        ...bookingData,
        userId,
        status: BOOKING_STATUS.PENDING,
      });

      await booking.save();

      // Populate user information
      await booking.populate('userId', 'name email phone');

      // Send notifications
      try {
        await this.sendBookingNotifications(booking, 'new_booking');
      } catch (notificationError) {
        logger.error('Failed to send booking notifications:', notificationError);
        // Don't fail booking creation if notifications fail
      }

      logger.info(`Booking created successfully: ${booking.bookingReference}`, {
        userId,
        bookingId: booking._id,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
      });

      return booking;
    } catch (error) {
      if (error.code) throw error;
      logger.error('Booking creation failed:', {
        error: error.message,
        userId,
        bookingData: { ...bookingData, userId: undefined },
      });
      throw this.createBookingError('Failed to create booking', 'BOOKING_CREATION_FAILED', 500);
    }
  }

  /**
   * Get booking by ID
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID (optional, for access control)
   * @param {boolean} isAdmin - Whether requester is admin
   * @returns {Object} Booking details
   */
  static async getBookingById(bookingId, userId = null, isAdmin = false) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('userId', 'name email phone')
        .populate('adminId', 'name email');

      if (!booking || !booking.isActive) {
        throw this.createBookingError('Booking not found', 'BOOKING_NOT_FOUND', 404);
      }

      // Check access permissions
      if (!isAdmin && userId && booking.userId._id.toString() !== userId.toString()) {
        throw this.createBookingError('Access denied', 'ACCESS_DENIED', 403);
      }

      return booking;
    } catch (error) {
      if (error.code) throw error;
      logger.error('Get booking failed:', {
        error: error.message,
        bookingId,
        userId,
      });
      throw this.createBookingError('Failed to get booking', 'BOOKING_FETCH_FAILED', 500);
    }
  }

  /**
   * Get user bookings with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Paginated bookings
   */
  static async getUserBookings(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      // Verify user exists
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        throw this.createBookingError('User not found or inactive', 'USER_NOT_FOUND', 404);
      }

      // Build query options
      const queryOptions = {
        status,
        sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      };

      const bookings = await Booking.findByUser(userId, queryOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Booking.countDocuments({
        userId,
        isActive: true,
        ...(status && { status }),
      });

      const pagination = calculatePagination(page, limit, total);

      return {
        bookings,
        pagination,
      };
    } catch (error) {
      if (error.code) throw error;
      logger.error('Get user bookings failed:', {
        error: error.message,
        userId,
        options,
      });
      throw this.createBookingError('Failed to get user bookings', 'BOOKINGS_FETCH_FAILED', 500);
    }
  }

  /**
   * Update booking (user can only update pending bookings)
   * @param {string} bookingId - Booking ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID
   * @returns {Object} Updated booking
   */
  static async updateBooking(bookingId, updateData, userId) {
    try {
      const booking = await this.getBookingById(bookingId, userId, false);

      // Check if booking can be modified
      if (!booking.canBeModified()) {
        throw this.createBookingError(
          'Booking cannot be modified in current status',
          'BOOKING_NOT_MODIFIABLE',
          400
        );
      }

      // Validate event date if being updated
      if (updateData.eventDate && !isFutureDate(updateData.eventDate)) {
        throw this.createBookingError('Event date must be in the future', 'INVALID_DATE', 400);
      }

      // Check availability if date is being changed
      if (updateData.eventDate && updateData.eventDate !== booking.eventDate.toISOString()) {
        const availability = await Booking.checkAvailability(
          new Date(updateData.eventDate),
          bookingId
        );
        if (!availability.available) {
          throw this.createBookingError('Selected date is not available', 'DATE_NOT_AVAILABLE', 409);
        }
      }

      // Update allowed fields
      const allowedFields = [
        'eventType',
        'eventDate',
        'eventTime',
        'venue',
        'guestCount',
        'decorationStyle',
        'specialRequests',
        'referenceImages',
        'gallerySelections',
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          booking[field] = updateData[field];
        }
      });

      // Reset status to pending if it was modifications-requested
      if (booking.status === BOOKING_STATUS.MODIFICATIONS_REQUESTED) {
        booking.status = BOOKING_STATUS.PENDING;
        booking.adminComments = '';
      }

      await booking.save();
      await booking.populate('userId', 'name email phone');

      logger.info(`Booking updated successfully: ${booking.bookingReference}`, {
        userId,
        bookingId: booking._id,
        updatedFields: Object.keys(updateData),
      });

      return booking;
    } catch (error) {
      if (error.code) throw error;
      logger.error('Booking update failed:', {
        error: error.message,
        bookingId,
        userId,
      });
      throw this.createBookingError('Failed to update booking', 'BOOKING_UPDATE_FAILED', 500);
    }
  }

  /**
   * Cancel booking (soft delete)
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID
   * @returns {Object} Cancellation result
   */
  static async cancelBooking(bookingId, userId) {
    try {
      const booking = await this.getBookingById(bookingId, userId, false);

      // Check if booking can be cancelled
      if (booking.status === BOOKING_STATUS.APPROVED && booking.isExpired()) {
        throw this.createBookingError(
          'Cannot cancel booking after event date',
          'BOOKING_EXPIRED',
          400
        );
      }

      if (booking.status === BOOKING_STATUS.REJECTED) {
        throw this.createBookingError(
          'Booking is already rejected',
          'BOOKING_ALREADY_REJECTED',
          400
        );
      }

      // Soft delete the booking
      booking.isActive = false;
      // Keep the original status but mark as inactive
      await booking.save();

      logger.info(`Booking cancelled successfully: ${booking.bookingReference}`, {
        userId,
        bookingId: booking._id,
      });

      return {
        message: 'Booking cancelled successfully',
        bookingReference: booking.bookingReference,
      };
    } catch (error) {
      if (error.code) throw error;
      logger.error('Booking cancellation failed:', {
        error: error.message,
        bookingId,
        userId,
      });
      throw this.createBookingError('Failed to cancel booking', 'BOOKING_CANCELLATION_FAILED', 500);
    }
  }

  /**
   * Get all bookings for admin with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Object} Paginated bookings
   */
  static async getAllBookings(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        eventType,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
      } = options;

      // Build query options
      const queryOptions = {
        status,
        dateFrom,
        dateTo,
        sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      };

      let bookings = await Booking.findForAdmin(queryOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Apply additional filters
      if (eventType) {
        bookings = bookings.filter(booking => booking.eventType === eventType);
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        bookings = bookings.filter(booking => 
          searchRegex.test(booking.userId.name) ||
          searchRegex.test(booking.userId.email) ||
          searchRegex.test(booking.bookingReference)
        );
      }

      // Count total for pagination
      const countQuery = {
        isActive: true,
        ...(status && { status }),
        ...(eventType && { eventType }),
        ...(dateFrom && { eventDate: { $gte: new Date(dateFrom) } }),
        ...(dateTo && { 
          eventDate: { 
            ...((dateFrom && { $gte: new Date(dateFrom) }) || {}),
            $lte: new Date(dateTo) 
          } 
        }),
      };

      const total = await Booking.countDocuments(countQuery);
      const pagination = calculatePagination(page, limit, total);

      return {
        bookings,
        pagination,
      };
    } catch (error) {
      logger.error('Get all bookings failed:', {
        error: error.message,
        options,
      });
      throw this.createBookingError('Failed to get bookings', 'BOOKINGS_FETCH_FAILED', 500);
    }
  }

  /**
   * Update booking status (admin only)
   * @param {string} bookingId - Booking ID
   * @param {string} status - New status
   * @param {string} adminId - Admin ID
   * @param {string} comments - Admin comments
   * @param {number} totalAmount - Total amount (optional)
   * @returns {Object} Updated booking
   */
  static async updateBookingStatus(bookingId, status, adminId, comments = '', totalAmount = null) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('userId', 'name email phone');

      if (!booking || !booking.isActive) {
        throw this.createBookingError('Booking not found', 'BOOKING_NOT_FOUND', 404);
      }

      // Verify admin exists
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw this.createBookingError('Admin not found', 'ADMIN_NOT_FOUND', 404);
      }

      // Update booking status
      const oldStatus = booking.status;
      await booking.updateStatus(status, adminId, comments);

      // Update total amount if provided
      if (totalAmount !== null) {
        booking.totalAmount = totalAmount;
        await booking.save();
      }

      // Log admin activity
      await admin.logActivity('UPDATE_BOOKING_STATUS', 'booking', bookingId, {
        oldStatus,
        newStatus: status,
        comments,
        totalAmount,
      });

      // Send status update notifications
      try {
        await this.sendBookingStatusUpdateNotifications(booking, oldStatus, comments);
      } catch (notificationError) {
        logger.error('Failed to send status update notifications:', notificationError);
        // Don't fail status update if notifications fail
      }

      logger.info(`Booking status updated: ${booking.bookingReference}`, {
        bookingId,
        adminId,
        oldStatus,
        newStatus: status,
        comments,
      });

      // Populate updated booking
      await booking.populate('adminId', 'name email');

      return booking;
    } catch (error) {
      if (error.code) throw error;
      logger.error('Booking status update failed:', {
        error: error.message,
        bookingId,
        adminId,
        status,
      });
      throw this.createBookingError('Failed to update booking status', 'STATUS_UPDATE_FAILED', 500);
    }
  }

  /**
   * Get booking statistics
   * @param {Object} options - Filter options
   * @returns {Object} Booking statistics
   */
  static async getBookingStatistics(options = {}) {
    try {
      const { dateFrom, dateTo } = options;

      // Get overall statistics
      const overallStats = await Booking.getBookingStats();

      // Get time-based statistics if date range provided
      let timeBasedStats = null;
      if (dateFrom || dateTo) {
        const dateFilter = {};
        if (dateFrom) dateFilter.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.$lte = new Date(dateTo);

        timeBasedStats = await Booking.aggregate([
          {
            $match: {
              isActive: true,
              ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$totalAmount' },
            }
          }
        ]);
      }

      // Get recent bookings trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTrend = await Booking.aggregate([
        {
          $match: {
            isActive: true,
            createdAt: { $gte: thirtyDaysAgo },
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            count: { $sum: 1 },
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]);

      return {
        overall: overallStats,
        timeBased: timeBasedStats,
        recentTrend,
      };
    } catch (error) {
      logger.error('Get booking statistics failed:', {
        error: error.message,
        options,
      });
      throw this.createBookingError('Failed to get booking statistics', 'STATS_FETCH_FAILED', 500);
    }
  }

  /**
   * Check date availability
   * @param {Date} eventDate - Event date to check
   * @param {string} excludeBookingId - Booking ID to exclude from check
   * @returns {Object} Availability information
   */
  static async checkDateAvailability(eventDate, excludeBookingId = null) {
    try {
      if (!isFutureDate(eventDate)) {
        return {
          available: false,
          reason: 'Date must be in the future',
          existingBookings: 0,
        };
      }

      const availability = await Booking.checkAvailability(eventDate, excludeBookingId);
      
      return {
        available: availability.available,
        existingBookings: availability.existingBookings,
        conflictingBookings: availability.conflictingBookings.map(booking => ({
          id: booking._id,
          bookingReference: booking.bookingReference,
          eventTime: booking.eventTime,
          status: booking.status,
        })),
      };
    } catch (error) {
      logger.error('Check date availability failed:', {
        error: error.message,
        eventDate,
        excludeBookingId,
      });
      throw this.createBookingError('Failed to check availability', 'AVAILABILITY_CHECK_FAILED', 500);
    }
  }

  /**
   * Get upcoming bookings
   * @param {number} days - Number of days to look ahead
   * @returns {Array} Upcoming bookings
   */
  static async getUpcomingBookings(days = 7) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const upcomingBookings = await Booking.find({
        isActive: true,
        status: { $in: [BOOKING_STATUS.APPROVED, BOOKING_STATUS.PENDING] },
        eventDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .populate('userId', 'name email phone')
      .populate('adminId', 'name email')
      .sort({ eventDate: 1 });

      return upcomingBookings;
    } catch (error) {
      logger.error('Get upcoming bookings failed:', {
        error: error.message,
        days,
      });
      throw this.createBookingError('Failed to get upcoming bookings', 'UPCOMING_BOOKINGS_FAILED', 500);
    }
  }

  /**
   * Send booking notifications
   * @param {Object} booking - Booking object
   * @param {string} action - Action type
   */
  static async sendBookingNotifications(booking, action) {
    try {
      const user = booking.userId || booking.user;
      
      // Send confirmation email to user
      try {
        await emailService.sendBookingConfirmation(booking, user);
      } catch (emailError) {
        logger.error('Failed to send booking confirmation email:', emailError);
      }

      // Send WhatsApp notification if user has phone
      if (user.phone) {
        try {
          await whatsappService.sendBookingConfirmation(booking, user);
        } catch (whatsappError) {
          logger.error('Failed to send booking confirmation WhatsApp:', whatsappError);
        }
      }

      // Send admin notification
      try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPhone = process.env.ADMIN_PHONE;
        
        if (adminEmail) {
          await emailService.sendAdminNotification(adminEmail, booking, user, action);
        }
        
        if (adminPhone) {
          await whatsappService.sendAdminNotification(adminPhone, booking, user, action);
        }
      } catch (adminNotificationError) {
        logger.error('Failed to send admin notifications:', adminNotificationError);
      }
    } catch (error) {
      logger.error('Failed to send booking notifications:', error);
      throw error;
    }
  }

  /**
   * Send booking status update notifications
   * @param {Object} booking - Booking object
   * @param {string} oldStatus - Previous status
   * @param {string} comments - Admin comments
   */
  static async sendBookingStatusUpdateNotifications(booking, oldStatus, comments) {
    try {
      const user = booking.userId || booking.user;
      
      // Send status update email to user
      try {
        await emailService.sendBookingStatusUpdate(booking, user, oldStatus, comments);
      } catch (emailError) {
        logger.error('Failed to send status update email:', emailError);
      }

      // Send WhatsApp notification if user has phone
      if (user.phone) {
        try {
          await whatsappService.sendBookingStatusUpdate(booking, user, oldStatus, comments);
        } catch (whatsappError) {
          logger.error('Failed to send status update WhatsApp:', whatsappError);
        }
      }
    } catch (error) {
      logger.error('Failed to send status update notifications:', error);
      throw error;
    }
  }

  /**
   * Send event reminders
   * @param {number} daysAhead - Days ahead to send reminders
   */
  static async sendEventReminders(daysAhead = 3) {
    try {
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + daysAhead);
      
      const bookingsToRemind = await Booking.find({
        isActive: true,
        status: BOOKING_STATUS.APPROVED,
        eventDate: {
          $gte: new Date(reminderDate.toDateString()),
          $lt: new Date(reminderDate.getTime() + 24 * 60 * 60 * 1000),
        },
      }).populate('userId', 'name email phone');

      for (const booking of bookingsToRemind) {
        try {
          const user = booking.userId;
          
          // Send WhatsApp reminder if user has phone
          if (user.phone) {
            await whatsappService.sendEventReminder(booking, user, daysAhead);
          }
          
          logger.info(`Event reminder sent for booking: ${booking.bookingReference}`);
        } catch (reminderError) {
          logger.error(`Failed to send reminder for booking ${booking.bookingReference}:`, reminderError);
        }
      }

      return {
        remindersSent: bookingsToRemind.length,
        daysAhead,
      };
    } catch (error) {
      logger.error('Failed to send event reminders:', error);
      throw this.createBookingError('Failed to send event reminders', 'REMINDER_SEND_FAILED', 500);
    }
  }

  /**
   * Check booking conflict
   * @param {Date} eventDate - Event date
   * @param {string} eventTime - Event time
   * @param {string} excludeBookingId - Booking ID to exclude
   */
  static async checkBookingConflict(eventDate, eventTime, excludeBookingId = null) {
    try {
      const query = {
        eventDate: new Date(eventDate),
        eventTime,
        status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED] },
        isActive: true,
      };

      if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
      }

      const conflictingBooking = await Booking.findOne(query);
      return conflictingBooking;
    } catch (error) {
      logger.error('Failed to check booking conflict:', error);
      throw error;
    }
  }

  /**
   * Create booking error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {number} status - HTTP status code
   * @returns {Error} Booking error
   */
  static createBookingError(message, code, status = 400) {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    return error;
  }
}

module.exports = BookingService;