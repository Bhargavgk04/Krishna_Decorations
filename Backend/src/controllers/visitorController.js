const BookingService = require('../services/bookingService');
const { validateSchema, paginationSchema } = require('../utils/validators');
const { ERROR_CODES, BOOKING_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

class VisitorController {
  /**
   * Get visitor dashboard with comprehensive booking overview
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getDashboard(req, res) {
    try {
      const userId = req.user.id;

      // Get comprehensive dashboard data
      const [
        recentBookings,
        upcomingBookings,
        pendingBookings,
        approvedBookings,
        rejectedBookings,
        modificationRequestedBookings
      ] = await Promise.all([
        // Recent bookings (last 5)
        BookingService.getUserBookings(userId, {
          page: 1,
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
        // Upcoming approved bookings
        BookingService.getUserBookings(userId, {
          status: BOOKING_STATUS.APPROVED,
          page: 1,
          limit: 10,
          sortBy: 'eventDate',
          sortOrder: 'asc',
        }),
        // Pending bookings count
        BookingService.getUserBookings(userId, { 
          status: BOOKING_STATUS.PENDING, 
          limit: 1 
        }),
        // Approved bookings count
        BookingService.getUserBookings(userId, { 
          status: BOOKING_STATUS.APPROVED, 
          limit: 1 
        }),
        // Rejected bookings count
        BookingService.getUserBookings(userId, { 
          status: BOOKING_STATUS.REJECTED, 
          limit: 1 
        }),
        // Modification requested bookings
        BookingService.getUserBookings(userId, { 
          status: BOOKING_STATUS.MODIFICATIONS_REQUESTED,
          page: 1,
          limit: 10,
        }),
      ]);

      // Filter upcoming bookings to only future events
      const futureBookings = upcomingBookings.bookings.filter(booking => 
        new Date(booking.eventDate) > new Date()
      );

      // Calculate next upcoming event
      const nextEvent = futureBookings.length > 0 ? futureBookings[0] : null;

      // Calculate days until next event
      let daysUntilNextEvent = null;
      if (nextEvent) {
        const eventDate = new Date(nextEvent.eventDate);
        const today = new Date();
        const timeDiff = eventDate.getTime() - today.getTime();
        daysUntilNextEvent = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }

      const dashboardData = {
        user: {
          id: req.user.id,
          name: req.user.name || 'User',
          email: req.user.email,
          isVerified: req.user.isVerified,
        },
        summary: {
          totalBookings: recentBookings.pagination.totalItems,
          pendingBookings: pendingBookings.pagination.totalItems,
          approvedBookings: approvedBookings.pagination.totalItems,
          rejectedBookings: rejectedBookings.pagination.totalItems,
          modificationRequested: modificationRequestedBookings.pagination.totalItems,
        },
        nextEvent: nextEvent ? {
          ...nextEvent.toJSON(),
          daysUntil: daysUntilNextEvent,
        } : null,
        recentBookings: recentBookings.bookings,
        upcomingBookings: futureBookings.slice(0, 3), // Show top 3 upcoming
        modificationRequests: modificationRequestedBookings.bookings,
        quickStats: {
          thisMonthBookings: 0, // Will be calculated separately if needed
          totalSpent: approvedBookings.bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0),
        },
      };

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      logger.error('Get visitor dashboard failed:', {
        error: error.message,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Failed to load dashboard data',
        },
      });
    }
  }

  /**
   * Get visitor's booking history with advanced filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getBookingHistory(req, res) {
    try {
      const userId = req.user.id;
      
      // Validate and extract query parameters
      const validatedQuery = validateSchema(paginationSchema, req.query);
      
      // Add additional filters
      const options = {
        ...validatedQuery,
        status: req.query.status,
        eventType: req.query.eventType,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      // Get booking history
      const result = await BookingService.getUserBookings(userId, options);

      // Add additional metadata
      const enrichedResult = {
        ...result,
        filters: {
          status: req.query.status || 'all',
          eventType: req.query.eventType || 'all',
          dateRange: {
            from: req.query.dateFrom || null,
            to: req.query.dateTo || null,
          },
        },
        summary: {
          totalBookings: result.pagination.totalItems,
          currentPage: result.pagination.currentPage,
          totalPages: result.pagination.totalPages,
        },
      };

      res.status(200).json({
        success: true,
        data: enrichedResult,
      });
    } catch (error) {
      logger.error('Get booking history failed:', {
        error: error.message,
        userId: req.user?.id,
        query: req.query,
      });

      const statusCode = error.status || 500;
      const errorCode = error.code || ERROR_CODES.SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message,
        },
      });
    }
  }

  /**
   * Get bookings that need user attention (modifications requested)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getActionRequiredBookings(req, res) {
    try {
      const userId = req.user.id;

      // Get bookings that need modifications
      const modificationRequests = await BookingService.getUserBookings(userId, {
        status: BOOKING_STATUS.MODIFICATIONS_REQUESTED,
        page: 1,
        limit: 50, // Get all modification requests
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });

      // Get rejected bookings (user might want to create new ones)
      const rejectedBookings = await BookingService.getUserBookings(userId, {
        status: BOOKING_STATUS.REJECTED,
        page: 1,
        limit: 10,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });

      const actionRequiredData = {
        modificationRequests: {
          count: modificationRequests.pagination.totalItems,
          bookings: modificationRequests.bookings,
        },
        recentRejections: {
          count: rejectedBookings.pagination.totalItems,
          bookings: rejectedBookings.bookings,
        },
        totalActionItems: modificationRequests.pagination.totalItems,
      };

      res.status(200).json({
        success: true,
        data: actionRequiredData,
      });
    } catch (error) {
      logger.error('Get action required bookings failed:', {
        error: error.message,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Failed to get action required bookings',
        },
      });
    }
  }

  /**
   * Get visitor's booking statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getBookingStats(req, res) {
    try {
      const userId = req.user.id;

      // Get all user bookings for statistics
      const allBookings = await BookingService.getUserBookings(userId, {
        page: 1,
        limit: 1000, // Get all bookings for stats
      });

      const bookings = allBookings.bookings;

      // Calculate statistics
      const stats = {
        total: bookings.length,
        byStatus: {
          pending: bookings.filter(b => b.status === BOOKING_STATUS.PENDING).length,
          approved: bookings.filter(b => b.status === BOOKING_STATUS.APPROVED).length,
          rejected: bookings.filter(b => b.status === BOOKING_STATUS.REJECTED).length,
          modificationsRequested: bookings.filter(b => b.status === BOOKING_STATUS.MODIFICATIONS_REQUESTED).length,
        },
        byEventType: {},
        totalSpent: bookings
          .filter(b => b.status === BOOKING_STATUS.APPROVED)
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        averageBookingValue: 0,
        upcomingEvents: bookings.filter(b => 
          b.status === BOOKING_STATUS.APPROVED && 
          new Date(b.eventDate) > new Date()
        ).length,
        pastEvents: bookings.filter(b => 
          b.status === BOOKING_STATUS.APPROVED && 
          new Date(b.eventDate) <= new Date()
        ).length,
      };

      // Calculate by event type
      bookings.forEach(booking => {
        const eventType = booking.eventType;
        stats.byEventType[eventType] = (stats.byEventType[eventType] || 0) + 1;
      });

      // Calculate average booking value
      const approvedBookings = bookings.filter(b => 
        b.status === BOOKING_STATUS.APPROVED && b.totalAmount > 0
      );
      if (approvedBookings.length > 0) {
        stats.averageBookingValue = stats.totalSpent / approvedBookings.length;
      }

      // Get monthly trend (last 12 months)
      const monthlyTrend = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthBookings = bookings.filter(b => {
          const bookingDate = new Date(b.createdAt);
          return bookingDate >= monthStart && bookingDate <= monthEnd;
        });

        monthlyTrend.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          bookings: monthBookings.length,
          approved: monthBookings.filter(b => b.status === BOOKING_STATUS.APPROVED).length,
        });
      }

      const statsData = {
        ...stats,
        monthlyTrend,
        lastUpdated: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        data: statsData,
      });
    } catch (error) {
      logger.error('Get booking stats failed:', {
        error: error.message,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Failed to get booking statistics',
        },
      });
    }
  }

  /**
   * Quick booking modification for pending bookings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async quickModifyBooking(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { field, value } = req.body;

      // Validate quick modification request
      if (!field || value === undefined) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Field and value are required for quick modification',
          },
        });
      }

      // Allowed fields for quick modification
      const allowedFields = ['guestCount', 'eventTime', 'specialRequests', 'decorationStyle'];
      if (!allowedFields.includes(field)) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Field '${field}' is not allowed for quick modification`,
          },
        });
      }

      // Prepare update data
      const updateData = { [field]: value };

      // Update booking
      const booking = await BookingService.updateBooking(id, updateData, userId);

      logger.info(`Quick booking modification: ${booking.bookingReference}`, {
        userId,
        bookingId: booking._id,
        field,
        value,
      });

      res.status(200).json({
        success: true,
        message: `${field} updated successfully`,
        data: booking,
      });
    } catch (error) {
      logger.error('Quick modify booking failed:', {
        error: error.message,
        bookingId: req.params?.id,
        userId: req.user?.id,
        body: req.body,
      });

      const statusCode = error.status || 400;
      const errorCode = error.code || ERROR_CODES.VALIDATION_ERROR;

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message,
        },
      });
    }
  }

  /**
   * Get booking modification suggestions based on admin comments
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getModificationSuggestions(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get booking details
      const booking = await BookingService.getBookingById(id, userId, false);

      if (booking.status !== BOOKING_STATUS.MODIFICATIONS_REQUESTED) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Booking is not in modification requested status',
          },
        });
      }

      // Parse admin comments to generate suggestions
      const suggestions = {
        adminComments: booking.adminComments,
        suggestedChanges: [],
        quickActions: [],
      };

      // Simple keyword-based suggestions (can be enhanced with AI/ML)
      const comments = booking.adminComments.toLowerCase();
      
      if (comments.includes('guest') || comments.includes('count')) {
        suggestions.suggestedChanges.push({
          field: 'guestCount',
          suggestion: 'Consider adjusting the guest count',
          currentValue: booking.guestCount,
        });
        suggestions.quickActions.push({
          action: 'modify_guest_count',
          label: 'Update Guest Count',
          field: 'guestCount',
        });
      }

      if (comments.includes('time') || comments.includes('schedule')) {
        suggestions.suggestedChanges.push({
          field: 'eventTime',
          suggestion: 'Consider changing the event time',
          currentValue: booking.eventTime,
        });
        suggestions.quickActions.push({
          action: 'modify_time',
          label: 'Change Event Time',
          field: 'eventTime',
        });
      }

      if (comments.includes('decoration') || comments.includes('style')) {
        suggestions.suggestedChanges.push({
          field: 'decorationStyle',
          suggestion: 'Consider selecting a different decoration style',
          currentValue: booking.decorationStyle,
        });
        suggestions.quickActions.push({
          action: 'modify_decoration',
          label: 'Change Decoration Style',
          field: 'decorationStyle',
        });
      }

      if (comments.includes('venue') || comments.includes('location')) {
        suggestions.suggestedChanges.push({
          field: 'venue',
          suggestion: 'Consider changing the venue',
          currentValue: booking.venue,
        });
      }

      res.status(200).json({
        success: true,
        data: {
          booking: {
            id: booking._id,
            bookingReference: booking.bookingReference,
            status: booking.status,
          },
          suggestions,
        },
      });
    } catch (error) {
      logger.error('Get modification suggestions failed:', {
        error: error.message,
        bookingId: req.params?.id,
        userId: req.user?.id,
      });

      const statusCode = error.status || 404;
      const errorCode = error.code || ERROR_CODES.NOT_FOUND_ERROR;

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message,
        },
      });
    }
  }
}

module.exports = VisitorController;