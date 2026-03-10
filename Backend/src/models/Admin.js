const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ADMIN_PERMISSIONS, ADMIN_ROLES } = require('../config/constants');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address',
    ],
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false, // Don't include password in queries by default
  },
  phone: {
    type: String,
    trim: true,
    match: [
      /^[\+]?[1-9][\d]{0,15}$/,
      'Please provide a valid phone number',
    ],
  },
  role: {
    type: String,
    required: true,
    enum: ADMIN_ROLES,
    default: 'admin',
    index: true,
  },
  permissions: [{
    type: String,
    enum: ADMIN_PERMISSIONS,
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastLogin: {
    type: Date,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  twoFactorSecret: {
    type: String,
    select: false,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  profileImage: {
    url: String,
    publicId: String,
  },
  department: {
    type: String,
    trim: true,
    enum: ['operations', 'sales', 'design', 'management', 'support'],
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  workingHours: {
    start: {
      type: String,
      default: '09:00',
    },
    end: {
      type: String,
      default: '18:00',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
  },
  notifications: {
    email: {
      type: Boolean,
      default: true,
    },
    sms: {
      type: Boolean,
      default: false,
    },
    push: {
      type: Boolean,
      default: true,
    },
  },
  activityLog: [{
    action: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  }],
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
    language: {
      type: String,
      default: 'en',
    },
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY',
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '12h',
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1, isActive: 1 });
adminSchema.index({ department: 1 });
adminSchema.index({ 'activityLog.timestamp': -1 });

// Virtual for account lock status
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for full name (if needed)
adminSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash the password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update password changed timestamp
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure JWT is created after password change
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate employee ID
adminSchema.pre('save', async function(next) {
  if (this.isNew && !this.employeeId) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    const sequence = String(count + 1).padStart(4, '0');
    this.employeeId = `KD${year}${sequence}`;
  }
  next();
});

// Instance method to check password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after JWT was issued
adminSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to handle failed login attempts
adminSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
adminSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: Date.now() },
  });
};

// Instance method to check permissions
adminSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  return this.permissions.includes(permission);
};

// Instance method to check multiple permissions
adminSchema.methods.hasPermissions = function(permissions) {
  if (this.role === 'super_admin') return true;
  return permissions.every(permission => this.permissions.includes(permission));
};

// Instance method to check if admin can manage another admin
adminSchema.methods.canManage = function(targetAdmin) {
  if (this.role === 'super_admin') return true;
  if (this.role === 'manager' && targetAdmin.role === 'admin') return true;
  return false;
};

// Instance method to log activity
adminSchema.methods.logActivity = function(action, resource, resourceId = null, details = {}, req = null) {
  const logEntry = {
    action,
    resource,
    resourceId,
    details,
    timestamp: new Date(),
  };
  
  if (req) {
    logEntry.ipAddress = req.ip || req.connection.remoteAddress;
    logEntry.userAgent = req.get('User-Agent');
  }
  
  this.activityLog.push(logEntry);
  
  // Keep only last 100 activity log entries
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }
  
  return this.save();
};

// Static method to find active admins
adminSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find admins by role
adminSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Static method to find admins with permission
adminSchema.statics.findWithPermission = function(permission) {
  return this.find({
    $or: [
      { role: 'super_admin' },
      { permissions: permission },
    ],
    isActive: true,
  });
};

// Static method to get admin statistics
adminSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalAdmins: { $sum: 1 },
        activeAdmins: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
        roleDistribution: {
          $push: '$role',
        },
        departmentDistribution: {
          $push: '$department',
        },
      },
    },
  ]);
};

// Static method to cleanup old activity logs
adminSchema.statics.cleanupActivityLogs = function(daysToKeep = 90) {
  const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
  
  return this.updateMany(
    {},
    {
      $pull: {
        activityLog: {
          timestamp: { $lt: cutoffDate },
        },
      },
    }
  );
};

// Static method to create a new admin
adminSchema.statics.createAdmin = async function(adminData, permissions = []) {
  if (!adminData) throw new Error('Admin data is required');
  const admin = new this({
    ...adminData,
    permissions: permissions.length ? permissions : adminData.permissions || [],
  });
  await admin.save();
  return admin;
};

module.exports = mongoose.model('Admin', adminSchema);