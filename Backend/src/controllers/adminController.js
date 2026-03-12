const Admin = require('../models/Admin');
const BookingService = require('../services/bookingService');
const AnalyticsService = require('../services/analyticsService');
const JWTService = require('../services/jwtService');
const emailService = require('../services/emailService');
const { ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

class AdminController {
  /**
   * Admin login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Email and password are required',
          },
        });
      }

      // Find admin and include password for comparison
      const admin = await Admin.findOne({ 
        email: email.toLowerCase(),
        isActive: true,
      }).select('+password');
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.INVALID_CREDENTIALS,
            message: 'Invalid email or password',
          },
        });
      }

      // Check if account is locked
      if (admin.isLocked) {
        return res.status(423).json({
          success: false,
          error: {
            code: ERROR_CODES.ACCOUNT_LOCKED,
            message: 'Account is temporarily locked due to too many failed login attempts',
          },
        });
      }

      // Verify password
      const isPasswordValid = await admin.comparePassword(password);
      
      if (!isPasswordValid) {
        // Increment failed login attempts
        await admin.incLoginAttempts();
        
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.INVALID_CREDENTIALS,
            message: 'Invalid email or password',
          },
        });
      }

      // Reset login attempts on successful login
      if (admin.loginAttempts > 0) {
        await admin.resetLoginAttempts();
      }

      // Log admin activity
      await admin.logActivity('LOGIN', 'admin', admin._id, {}, req);

      // Generate authentication tokens
      const tokens = JWTService.generateTokenPair(admin, 'admin');

      // Remove password from response
      const adminResponse = admin.toObject();
      delete adminResponse.password;

      logger.info('Admin logged in successfully:', {
        adminId: admin._id,
        email: admin.email,
        role: admin.role,
      });

      res.status(200).json({
        success: true,
        message: 'Admin login successful',
        data: {
          admin: adminResponse,
          tokens,
        },
      });
    } catch (error) {
      logger.error('Admin login failed:', {
        error: error.message,
        email: req.body.email,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Login failed. Please try again.',
        },
      });
    }
  }

  /**
   * Get admin dashboard data
   */
  static async getDashboard(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const dashboardData = await AnalyticsService.getDashboardOverview({
        startDate,
        endDate,
      });

      // Log admin activity
      await req.user.logActivity('VIEW_DASHBOARD', 'dashboard', null, {
        dateRange: { startDate, endDate },
      }, req);

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      logger.error('Get admin dashboard failed:', {
        error: error.message,
        adminId: req.user?.id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Failed to get dashboard data',
        },
      });
    }
  }

  /**
   * Get admin profile
   */
  static async getProfile(req, res) {
    try {
      const adminId = req.user.id;

      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.ADMIN_NOT_FOUND,
            message: 'Admin not found',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: {
          admin,
        },
      });
    } catch (error) {
      logger.error('Failed to get admin profile:', {
        error: error.message,
        adminId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Failed to get admin profile',
        },
      });
    }
  }

  /**
   * Update admin profile
   */
  static async updateProfile(req, res) {
    try {
      const adminId = req.user.id;
      const { name, phone, department, preferences } = req.body;

      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.ADMIN_NOT_FOUND,
            message: 'Admin not found',
          },
        });
      }

      // Update allowed fields
      if (name) admin.name = name.trim();
      if (phone !== undefined) admin.phone = phone?.trim();
      if (department) admin.department = department;
      if (preferences) {
        admin.preferences = { ...admin.preferences, ...preferences };
      }

      await admin.save();

      // Log admin activity
      await admin.logActivity('UPDATE_PROFILE', 'admin', adminId, {
        updatedFields: Object.keys(req.body),
      }, req);

      logger.info('Admin profile updated:', {
        adminId: admin._id,
        email: admin.email,
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          admin,
        },
      });
    } catch (error) {
      logger.error('Admin profile update failed:', {
        error: error.message,
        adminId: req.user?.id,
      });

      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            details: validationErrors,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Profile update failed',
        },
      });
    }
  }

  /**
   * Change admin password
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const adminId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Current password and new password are required',
          },
        });
      }

      // Find admin with password
      const admin = await Admin.findById(adminId).select('+password');
      if (!admin) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.ADMIN_NOT_FOUND,
            message: 'Admin not found',
          },
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.INVALID_CREDENTIALS,
            message: 'Current password is incorrect',
          },
        });
      }

      // Update password
      admin.password = newPassword;
      admin.passwordChangedAt = new Date();
      await admin.save();

      // Log admin activity
      await admin.logActivity('CHANGE_PASSWORD', 'admin', adminId, {}, req);

      logger.info('Admin password changed successfully:', {
        adminId: admin._id,
        email: admin.email,
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Admin password change failed:', {
        error: error.message,
        adminId: req.user?.id,
      });

      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            details: validationErrors,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Password change failed',
        },
      });
    }
  }

  /**
   * Get admin activity log
   */
  static async getActivityLog(req, res) {
    try {
      const adminId = req.user.id;
      const { page = 1, limit = 20, action, resource } = req.query;

      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.ADMIN_NOT_FOUND,
            message: 'Admin not found',
          },
        });
      }

      let activityLog = admin.activityLog;

      // Filter by action if provided
      if (action) {
        activityLog = activityLog.filter(log => log.action === action);
      }

      // Filter by resource if provided
      if (resource) {
        activityLog = activityLog.filter(log => log.resource === resource);
      }

      // Sort by timestamp (newest first)
      activityLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedLog = activityLog.slice(startIndex, endIndex);

      const pagination = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(activityLog.length / limit),
        totalItems: activityLog.length,
        itemsPerPage: parseInt(limit),
        hasNextPage: endIndex < activityLog.length,
        hasPrevPage: startIndex > 0,
      };

      res.status(200).json({
        success: true,
        data: {
          activityLog: paginatedLog,
          pagination,
        },
      });
    } catch (error) {
      logger.error('Get admin activity log failed:', {
        error: error.message,
        adminId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Failed to get activity log',
        },
      });
    }
  }

  /**
   * Get all admins (Super Admin only)
   */
  static async getAllAdmins(req, res) {
    try {
      const { page = 1, limit = 10, role, department, isActive } = req.query;

      const query = {};
      if (role) query.role = role;
      if (department) query.department = department;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const admins = await Admin.find(query)
        .select('-password -passwordResetToken -passwordResetExpires -twoFactorSecret')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Admin.countDocuments(query);

      const pagination = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      };

      // Log admin activity
      const currentAdmin = await Admin.findById(req.user.id);
      await currentAdmin.logActivity('VIEW_ALL_ADMINS', 'admin', null, {
        filters: { role, department, isActive },
      }, req);

      res.status(200).json({
        success: true,
        data: {
          admins,
          pagination,
        },
      });
    } catch (error) {
      logger.error('Get all admins failed:', {
        error: error.message,
        adminId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Failed to get admins',
        },
      });
    }
  }

  /**
   * Create new admin (Super Admin only)
   */
  static async createAdmin(req, res) {
    try {
      const { name, email, password, role, department, permissions } = req.body;

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.ADMIN_ALREADY_EXISTS,
            message: 'Admin with this email already exists',
          },
        });
      }

      // Create new admin
      const admin = new Admin({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role,
        department,
        permissions: permissions || [],
        supervisor: req.user.id,
      });

      await admin.save();

      // Send welcome email
      try {
        await emailService.sendAdminWelcome(admin, password);
      } catch (emailError) {
        logger.error('Failed to send admin welcome email:', emailError);
        // Don't fail admin creation if email fails
      }

      // Log admin activity
      const currentAdmin = await Admin.findById(req.user.id);
      await currentAdmin.logActivity('CREATE_ADMIN', 'admin', admin._id, {
        adminEmail: admin.email,
        role: admin.role,
        department: admin.department,
      }, req);

      // Remove password from response
      const adminResponse = admin.toObject();
      delete adminResponse.password;

      logger.info('Admin created successfully:', {
        adminId: admin._id,
        email: admin.email,
        createdBy: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: {
          admin: adminResponse,
        },
      });
    } catch (error) {
      logger.error('Admin creation failed:', {
        error: error.message,
        email: req.body.email,
        createdBy: req.user?.id,
      });

      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            details: validationErrors,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Admin creation failed',
        },
      });
    }
  }

  /**
   * Update admin (Super Admin/Manager only)
   */
  static async updateAdmin(req, res) {
    try {
      const { adminId } = req.params;
      const { name, role, department, permissions, isActive } = req.body;

      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.ADMIN_NOT_FOUND,
            message: 'Admin not found',
          },
        });
      }

      // Check if current admin can manage target admin
      const currentAdmin = await Admin.findById(req.user.id);
      if (!currentAdmin.canManage(admin)) {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.ACCESS_DENIED,
            message: 'You do not have permission to manage this admin',
          },
        });
      }

      // Update allowed fields
      if (name) admin.name = name.trim();
      if (role) admin.role = role;
      if (department) admin.department = department;
      if (permissions) admin.permissions = permissions;
      if (isActive !== undefined) admin.isActive = isActive;

      await admin.save();

      // Log admin activity
      await currentAdmin.logActivity('UPDATE_ADMIN', 'admin', adminId, {
        updatedFields: Object.keys(req.body),
        targetAdmin: admin.email,
      }, req);

      logger.info('Admin updated successfully:', {
        adminId: admin._id,
        email: admin.email,
        updatedBy: req.user.id,
      });

      res.status(200).json({
        success: true,
        message: 'Admin updated successfully',
        data: {
          admin,
        },
      });
    } catch (error) {
      logger.error('Admin update failed:', {
        error: error.message,
        adminId: req.params.adminId,
        updatedBy: req.user?.id,
      });

      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            details: validationErrors,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Admin update failed',
        },
      });
    }
  }

  /**
   * Deactivate admin (Super Admin only)
   */
  static async deactivateAdmin(req, res) {
    try {
      const { adminId } = req.params;

      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.ADMIN_NOT_FOUND,
            message: 'Admin not found',
          },
        });
      }

      // Prevent self-deactivation
      if (adminId === req.user.id) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.INVALID_OPERATION,
            message: 'Cannot deactivate your own account',
          },
        });
      }

      admin.isActive = false;
      await admin.save();

      // Log admin activity
      const currentAdmin = await Admin.findById(req.user.id);
      await currentAdmin.logActivity('DEACTIVATE_ADMIN', 'admin', adminId, {
        targetAdmin: admin.email,
      }, req);

      logger.info('Admin deactivated successfully:', {
        adminId: admin._id,
        email: admin.email,
        deactivatedBy: req.user.id,
      });

      res.status(200).json({
        success: true,
        message: 'Admin deactivated successfully',
      });
    } catch (error) {
      logger.error('Admin deactivation failed:', {
        error: error.message,
        adminId: req.params.adminId,
        deactivatedBy: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Admin deactivation failed',
        },
      });
    }
  }

  /**
   * Get all registered users (Admin only)
   */
  static async getAllUsers(req, res) {
    try {
      const User = require('../models/User');
      const { page = 1, limit = 10, search, isActive } = req.query;

      const query = { role: 'user' }; // Only fetch regular users
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      const pagination = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      };

      // Log admin activity
      await req.user.logActivity('VIEW_ALL_USERS', 'user', null, {
        filters: { search, isActive },
      }, req);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination,
        },
      });
    } catch (error) {
      logger.error('Get all users failed:', {
        error: error.message,
        adminId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Failed to get users',
        },
      });
    }
  }

  /**
   * Update user status (Admin only)
   */
  static async updateUserStatus(req, res) {
    try {
      const User = require('../models/User');
      const { userId } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'isActive status is required',
          },
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.USER_NOT_FOUND,
            message: 'User not found',
          },
        });
      }

      user.isActive = isActive;
      await user.save();

      // Log admin activity
      await req.user.logActivity('UPDATE_USER_STATUS', 'user', userId, {
        userEmail: user.email,
        isActive,
      }, req);

      logger.info('User status updated by admin:', {
        userId,
        email: user.email,
        isActive,
        adminId: req.user.id,
      });

      res.status(200).json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          user,
        },
      });
    } catch (error) {
      logger.error('Update user status failed:', {
        error: error.message,
        userId: req.params.userId,
        adminId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Failed to update user status',
        },
      });
    }
  }
}

module.exports = AdminController;