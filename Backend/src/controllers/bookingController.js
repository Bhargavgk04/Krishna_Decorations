const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');
const { sendBookingConfirmation, sendBookingUpdate } = require('../services/emailService');
const { sendWhatsAppNotification } = require('../services/whatsappService');
const logger = require('../utils/logger');
const { formatDate, generateBookingId } = require('../utils/helpers');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      customerName,
      email,
      phone,
      eventType,
      eventDate,
      venue,
      guestCount,
      budget,
      requirements,
      preferredTime,
      additionalServices
    } = req.body;

    // Generate unique booking ID
    const bookingId = generateBookingId();

    // Create booking
    const booking = new Booking({
      bookingId,
      customerName,
      email,
      phone,
      eventType,
      eventDate: new Date(eventDate),
      venue,
      guestCount,
      budget,
      requirements,
      preferredTime,
      additionalServices: additionalServices || [],
      status: 'pending',
      createdAt: new Date()
    });

    await booking.save();

    // Send confirmation email
    try {
      await sendBookingConfirmation(booking);
    } catch (emailError) {
      logger.error('Failed to send booking confirmation email:', emailError);
    }

    // Send WhatsApp notification to admin
    try {
      await sendWhatsAppNotification({
        type: 'new_booking',
        booking: booking
      });
    } catch (whatsappError) {
      logger.error('Failed to send WhatsApp notification:', whatsappError);
    }

    logger.info(`New booking created: ${bookingId}`);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: booking.bookingId,
        status: booking.status,
        eventDate: formatDate(booking.eventDate)
      }
    });

  } catch (error) {
    logger.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all bookings (admin only)
exports.getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      eventType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (eventType) query.eventType = eventType;
    
    // Apply search
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { bookingId: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const bookings = await Booking.paginate(query, options);

    res.json({
      success: true,
      data: bookings.docs,
      pagination: {
        currentPage: bookings.page,
        totalPages: bookings.totalPages,
        totalItems: bookings.totalDocs,
        hasNext: bookings.hasNextPage,
        hasPrev: bookings.hasPrevPage
      }
    });

  } catch (error) {
    logger.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findOne({
      $or: [
        { _id: id },
        { bookingId: id }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    logger.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const oldStatus = booking.status;
    booking.status = status;
    
    if (notes) {
      booking.adminNotes = booking.adminNotes || [];
      booking.adminNotes.push({
        note: notes,
        addedBy: req.user?.id || 'admin',
        addedAt: new Date()
      });
    }

    booking.updatedAt = new Date();
    await booking.save();

    // Send update notification
    try {
      await sendBookingUpdate(booking, oldStatus);
    } catch (emailError) {
      logger.error('Failed to send booking update email:', emailError);
    }

    // Send WhatsApp notification
    try {
      await sendWhatsAppNotification({
        type: 'booking_update',
        booking: booking,
        oldStatus,
        newStatus: status
      });
    } catch (whatsappError) {
      logger.error('Failed to send WhatsApp notification:', whatsappError);
    }

    logger.info(`Booking ${booking.bookingId} status updated from ${oldStatus} to ${status}`);

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });

  } catch (error) {
    logger.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update booking details
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.bookingId;
    delete updates.createdAt;
    
    updates.updatedAt = new Date();

    const booking = await Booking.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    logger.info(`Booking ${booking.bookingId} updated`);

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });

  } catch (error) {
    logger.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    logger.info(`Booking ${booking.bookingId} deleted`);

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get booking statistics
exports.getBookingStats = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments();
    const recentBookings = await Booking.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const eventTypeStats = await Booking.aggregate([
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statusStats: stats,
        totalBookings,
        recentBookings,
        eventTypeStats
      }
    });

  } catch (error) {
    logger.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Check availability for a date
exports.checkAvailability = async (req, res) => {
  try {
    const { date, eventType } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

    const query = {
      eventDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['confirmed', 'in_progress'] }
    };

    if (eventType) {
      query.eventType = eventType;
    }

    const existingBookings = await Booking.find(query);
    const isAvailable = existingBookings.length === 0;

    res.json({
      success: true,
      data: {
        date: formatDate(requestedDate),
        available: isAvailable,
        existingBookings: existingBookings.length,
        conflictingBookings: existingBookings.map(booking => ({
          bookingId: booking.bookingId,
          eventType: booking.eventType,
          customerName: booking.customerName
        }))
      }
    });

  } catch (error) {
    logger.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalItems = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        limit: limitNum
      }
    });

  } catch (error) {
    logger.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get single booking
exports.getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const query = {
      $or: [
        { _id: bookingId },
        { bookingId: bookingId }
      ]
    };

    // Non-admin users can only see their own bookings
    if (!isAdmin) {
      query.userId = userId;
    }

    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    logger.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      $or: [
        { _id: bookingId },
        { bookingId: bookingId }
      ],
      userId: userId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    const oldStatus = booking.status;
    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    await booking.save();

    // Send cancellation notification
    try {
      await sendBookingUpdate(booking, oldStatus);
    } catch (emailError) {
      logger.error('Failed to send cancellation email:', emailError);
    }

    logger.info(`Booking ${booking.bookingId} cancelled by user`);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    logger.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get booking statistics (admin)
exports.getBookingStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalBookings,
      recentBookings,
      statusStats,
      eventTypeStats,
      monthlyStats
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startDate } }),
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$budget' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        recentBookings,
        statusStats,
        eventTypeStats,
        monthlyStats,
        period: `${days} days`
      }
    });

  } catch (error) {
    logger.error('Error fetching booking statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get upcoming bookings (admin)
exports.getUpcomingBookings = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const endDate = new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000);

    const upcomingBookings = await Booking.find({
      eventDate: {
        $gte: new Date(),
        $lte: endDate
      },
      status: { $in: ['confirmed', 'in_progress'] }
    }).sort({ eventDate: 1 });

    res.json({
      success: true,
      data: upcomingBookings,
      count: upcomingBookings.length
    });

  } catch (error) {
    logger.error('Error fetching upcoming bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Send event reminders (admin)
exports.sendEventReminders = async (req, res) => {
  try {
    const { days = 1 } = req.body;
    const reminderDate = new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(reminderDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(reminderDate.setHours(23, 59, 59, 999));

    const bookingsToRemind = await Booking.find({
      eventDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'confirmed'
    });

    const results = [];
    for (const booking of bookingsToRemind) {
      try {
        await sendBookingReminder(booking, days);
        results.push({
          bookingId: booking.bookingId,
          customerName: booking.customerName,
          status: 'sent'
        });
      } catch (error) {
        logger.error(`Failed to send reminder for booking ${booking.bookingId}:`, error);
        results.push({
          bookingId: booking.bookingId,
          customerName: booking.customerName,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${bookingsToRemind.length} reminder(s)`,
      data: results
    });

  } catch (error) {
    logger.error('Error sending event reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};