const mongoose = require('mongoose');
const { BOOKING_STATUS, EVENT_TYPES } = require('../config/constants');

const bookingSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: EVENT_TYPES,
    index: true,
  },
  eventDate: {
    type: Date,
    required: true,
    index: true,
  },
  eventTime: {
    type: String,
    required: true,
  },
  venue: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  guestCount: {
    type: Number,
    required: true,
    min: [1, 'Guest count must be at least 1'],
    max: [10000, 'Guest count cannot exceed 10,000'],
  },
  decorationStyle: {
    type: String,
    trim: true,
  },
  specialRequests: {
    type: String,
    trim: true,
    maxlength: [2000, 'Special requests cannot exceed 2000 characters'],
  },
  referenceImages: [{
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  status: {
    type: String,
    required: true,
    enum: BOOKING_STATUS,
    default: 'pending',
    index: true,
  },
  adminComments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin comments cannot exceed 1000 characters'],
  },
  estimatedCost: {
    type: Number,
    min: [0, 'Estimated cost cannot be negative'],
  },
  finalCost: {
    type: Number,
    min: [0, 'Final cost cannot be negative'],
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending',
    index: true,
  },
  advanceAmount: {
    type: Number,
    min: [0, 'Advance amount cannot be negative'],
    default: 0,
  },
  balanceAmount: {
    type: Number,
    min: [0, 'Balance amount cannot be negative'],
    default: 0,
  },
  statusHistory: [{
    status: {
      type: String,
      enum: BOOKING_STATUS,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    comments: {
      type: String,
      trim: true,
    },
  }],
  assignedTeam: [{
    member: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
  }],
  eventDetails: {
    setupTime: {
      type: String,
    },
    eventDuration: {
      type: Number, // in hours
      min: [1, 'Event duration must be at least 1 hour'],
    },
    cleanupTime: {
      type: String,
    },
    additionalServices: [{
      service: {
        type: String,
        required: true,
        trim: true,
      },
      cost: {
        type: Number,
        min: [0, 'Service cost cannot be negative'],
      },
      description: {
        type: String,
        trim: true,
      },
    }],
  },
  contactPreferences: {
    preferredMethod: {
      type: String,
      enum: ['email', 'phone', 'whatsapp'],
      default: 'email',
    },
    bestTimeToCall: {
      type: String,
      trim: true,
    },
  },
  cancellationReason: {
    type: String,
    trim: true,
  },
  cancelledAt: {
    type: Date,
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'cancelledByModel',
  },
  cancelledByModel: {
    type: String,
    enum: ['User', 'Admin'],
  },
  completedAt: {
    type: Date,
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5'],
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ eventDate: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ eventType: 1, eventDate: 1 });
bookingSchema.index({ 'statusHistory.changedAt': -1 });

// Virtual for days until event
bookingSchema.virtual('daysUntilEvent').get(function() {
  if (!this.eventDate) return null;
  const today = new Date();
  const eventDate = new Date(this.eventDate);
  const diffTime = eventDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for event status based on date
bookingSchema.virtual('eventStatus').get(function() {
  if (!this.eventDate) return 'unknown';
  const today = new Date();
  const eventDate = new Date(this.eventDate);
  
  if (this.status === 'completed') return 'completed';
  if (this.status === 'cancelled') return 'cancelled';
  if (eventDate < today) return 'past';
  if (eventDate.toDateString() === today.toDateString()) return 'today';
  return 'upcoming';
});

// Virtual for total cost
bookingSchema.virtual('totalCost').get(function() {
  let total = this.finalCost || this.estimatedCost || 0;
  
  if (this.eventDetails && this.eventDetails.additionalServices) {
    const additionalCost = this.eventDetails.additionalServices.reduce((sum, service) => {
      return sum + (service.cost || 0);
    }, 0);
    total += additionalCost;
  }
  
  return total;
});

// Pre-save middleware to generate booking reference
bookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookingReference) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sequence = String(count + 1).padStart(4, '0');
    this.bookingReference = `KD${year}${month}${sequence}`;
  }
  next();
});

// Pre-save middleware to update balance amount
bookingSchema.pre('save', function(next) {
  if (this.finalCost && this.advanceAmount) {
    this.balanceAmount = this.finalCost - this.advanceAmount;
  }
  next();
});

// Method to add status history entry
bookingSchema.methods.addStatusHistory = function(status, changedBy, comments = '') {
  this.statusHistory.push({
    status,
    changedBy,
    comments,
    changedAt: new Date(),
  });
  this.status = status;
  this.updatedBy = changedBy;
};

// Method to check if booking can be modified
bookingSchema.methods.canBeModified = function() {
  return ['pending', 'modifications-requested'].includes(this.status);
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const allowedStatuses = ['pending', 'approved', 'modifications-requested'];
  const eventDate = new Date(this.eventDate);
  const today = new Date();
  const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
  
  return allowedStatuses.includes(this.status) && daysUntilEvent > 1;
};

// Method to calculate cancellation charges
bookingSchema.methods.calculateCancellationCharges = function() {
  const eventDate = new Date(this.eventDate);
  const today = new Date();
  const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
  const totalCost = this.totalCost;
  
  if (daysUntilEvent > 30) {
    return totalCost * 0.1; // 10% cancellation charge
  } else if (daysUntilEvent > 15) {
    return totalCost * 0.25; // 25% cancellation charge
  } else if (daysUntilEvent > 7) {
    return totalCost * 0.5; // 50% cancellation charge
  } else {
    return totalCost * 0.75; // 75% cancellation charge
  }
};

// Static method to find bookings by date range
bookingSchema.statics.findByDateRange = function(startDate, endDate, additionalFilters = {}) {
  return this.find({
    eventDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
    ...additionalFilters,
  });
};

// Static method to find upcoming events
bookingSchema.statics.findUpcomingEvents = function(days = 7) {
  const today = new Date();
  const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return this.find({
    eventDate: {
      $gte: today,
      $lte: futureDate,
    },
    status: { $in: ['approved', 'pending'] },
  }).populate('user', 'name email phone');
};

// Static method to get booking statistics
bookingSchema.statics.getStatistics = function(dateFilter = {}) {
  return this.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        pendingBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        approvedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
        },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        totalRevenue: {
          $sum: { $cond: [{ $ne: ['$finalCost', null] }, '$finalCost', '$estimatedCost'] },
        },
        averageGuestCount: { $avg: '$guestCount' },
      },
    },
  ]);
};

// Static method to check date availability
bookingSchema.statics.checkAvailability = function(eventDate, excludeBookingId = null) {
  const query = {
    eventDate: new Date(eventDate),
    status: { $in: ['pending', 'approved'] },
    isArchived: false,
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return this.find(query).then(conflictingBookings => {
    return {
      available: conflictingBookings.length === 0,
      existingBookings: conflictingBookings.length,
      conflictingBookings,
    };
  });
};

// Static method to find bookings by user
bookingSchema.statics.findByUser = function(userId, options = {}) {
  const query = {
    user: userId,
    isArchived: false,
  };

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .populate('user', 'name email phone')
    .sort(options.sort || { createdAt: -1 });
};

// Static method to find bookings for admin
bookingSchema.statics.findForAdmin = function(options = {}) {
  const query = {
    isArchived: false,
  };

  if (options.status) {
    query.status = options.status;
  }

  if (options.dateFrom || options.dateTo) {
    query.eventDate = {};
    if (options.dateFrom) query.eventDate.$gte = new Date(options.dateFrom);
    if (options.dateTo) query.eventDate.$lte = new Date(options.dateTo);
  }

  return this.find(query)
    .populate('user', 'name email phone')
    .populate('updatedBy', 'name email')
    .sort(options.sort || { createdAt: -1 });
};

// Static method to get booking stats
bookingSchema.statics.getBookingStats = function() {
  return this.aggregate([
    {
      $match: { isArchived: false }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        approved: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
        totalRevenue: {
          $sum: { $cond: [{ $ne: ['$finalCost', null] }, '$finalCost', '$estimatedCost'] },
        },
      },
    },
  ]).then(results => results[0] || {
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
};

// Method to update status with history
bookingSchema.methods.updateStatus = function(status, adminId, comments = '') {
  this.addStatusHistory(status, adminId, comments);
  return this.save();
};

// Method to check if booking is expired
bookingSchema.methods.isExpired = function() {
  const today = new Date();
  const eventDate = new Date(this.eventDate);
  return eventDate < today;
};

module.exports = mongoose.model('Booking', bookingSchema);