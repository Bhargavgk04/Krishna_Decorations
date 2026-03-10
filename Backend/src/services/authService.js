const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { Admin } = require('../models/Admin');
const { JWT, ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Generate JWT access token
   * @param {Object} payload - Token payload
   * @returns {string} JWT token
   */
  static generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: JWT.EXPIRE,
      issuer: 'event-booking-api',
      audience: 'event-booking-client',
    });
  }

  /**
   * Generate JWT refresh token
   * @param {Object} payload - Token payload
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: JWT.REFRESH_EXPIRE,
      issuer: 'event-booking-api',
      audience: 'event-booking-client',
    });
  }

  /**
   * Verify JWT access token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'event-booking-api',
        audience: 'event-booking-client',
      });
    } catch (error) {
      logger.error('Access token verification failed:', error.message);
      throw this.createAuthError('Invalid or expired access token', 'INVALID_TOKEN');
    }
  }

  /**
   * Verify JWT refresh token
   * @param {string} token - JWT refresh token to verify
   * @returns {Object} Decoded token payload
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: 'event-booking-api',
        audience: 'event-booking-client',
      });
    } catch (error) {
      logger.error('Refresh token verification failed:', error.message);
      throw this.createAuthError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * Generate token pair (access + refresh)
   * @param {Object} user - User object
   * @returns {Object} Token pair with user info
   */
  static generateTokenPair(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken({ userId: user._id });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.getTokenExpirationTime(JWT.EXPIRE),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @returns {Object} New token pair
   */
  static async refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Find user and ensure they're still active
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw this.createAuthError('User not found or inactive', 'USER_NOT_FOUND');
      }

      // Generate new token pair
      return this.generateTokenPair(user);
    } catch (error) {
      if (error.code) throw error;
      logger.error('Token refresh failed:', error.message);
      throw this.createAuthError('Token refresh failed', 'REFRESH_FAILED');
    }
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} ipAddress - Client IP address
   * @param {string} userAgent - Client user agent
   * @returns {Object} Authentication result with tokens
   */
  static async authenticateUser(email, password, ipAddress = null, userAgent = null) {
    try {
      // Find user with password
      const user = await User.findByEmailWithPassword(email);
      if (!user) {
        throw this.createAuthError('Invalid email or password', 'INVALID_CREDENTIALS');
      }

      // Check if account is active
      if (!user.isActive) {
        throw this.createAuthError('Account is deactivated', 'ACCOUNT_INACTIVE');
      }

      // Check if account is locked
      if (user.isLocked) {
        throw this.createAuthError('Account is temporarily locked due to multiple failed login attempts', 'ACCOUNT_LOCKED');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Record failed login attempt
        await user.incLoginAttempts();
        
        // Log failed attempt for admin users
        if (user.role === 'admin') {
          const admin = await Admin.findById(user._id);
          if (admin) {
            await admin.recordLogin(false, ipAddress, userAgent, 'Invalid password');
          }
        }
        
        throw this.createAuthError('Invalid email or password', 'INVALID_CREDENTIALS');
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Record successful login for admin users
      if (user.role === 'admin') {
        const admin = await Admin.findById(user._id);
        if (admin) {
          await admin.recordLogin(true, ipAddress, userAgent);
          await admin.createSession(); // Create admin session
        }
      }

      // Generate tokens
      const tokens = this.generateTokenPair(user);

      logger.info(`User authenticated successfully: ${user.email}`);
      return tokens;
    } catch (error) {
      if (error.code) throw error;
      logger.error('Authentication failed:', error.message);
      throw this.createAuthError('Authentication failed', 'AUTH_FAILED');
    }
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Object} Registration result with tokens
   */
  static async registerUser(userData) {
    try {
      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate verification token
      const verificationToken = this.generateVerificationToken();
      user.verificationToken = verificationToken;
      await user.save();

      // Generate tokens for immediate login
      const tokens = this.generateTokenPair(user);

      logger.info(`User registered successfully: ${user.email}`);
      return {
        ...tokens,
        verificationToken,
        message: 'Registration successful. Please verify your email.',
      };
    } catch (error) {
      if (error.code === 'DUPLICATE_ERROR') {
        throw this.createAuthError('Email already exists', 'EMAIL_EXISTS');
      }
      logger.error('Registration failed:', error.message);
      throw this.createAuthError('Registration failed', 'REGISTRATION_FAILED');
    }
  }

  /**
   * Verify user email
   * @param {string} token - Verification token
   * @returns {Object} Verification result
   */
  static async verifyEmail(token) {
    try {
      const user = await User.findOne({ 
        verificationToken: token,
        isActive: true 
      });

      if (!user) {
        throw this.createAuthError('Invalid or expired verification token', 'INVALID_VERIFICATION_TOKEN');
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();

      logger.info(`Email verified successfully: ${user.email}`);
      return {
        message: 'Email verified successfully',
        user: {
          id: user._id,
          email: user.email,
          isVerified: user.isVerified,
        },
      };
    } catch (error) {
      if (error.code) throw error;
      logger.error('Email verification failed:', error.message);
      throw this.createAuthError('Email verification failed', 'VERIFICATION_FAILED');
    }
  }

  /**
   * Initiate password reset
   * @param {string} email - User email
   * @returns {Object} Password reset result
   */
  static async initiatePasswordReset(email) {
    try {
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        // Don't reveal if email exists or not
        return {
          message: 'If the email exists, a password reset link has been sent.',
        };
      }

      // Generate reset token
      const resetToken = this.generatePasswordResetToken();
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      logger.info(`Password reset initiated for: ${user.email}`);
      return {
        message: 'Password reset link has been sent to your email.',
        resetToken, // In production, this should be sent via email
      };
    } catch (error) {
      logger.error('Password reset initiation failed:', error.message);
      throw this.createAuthError('Password reset failed', 'PASSWORD_RESET_FAILED');
    }
  }

  /**
   * Reset password using reset token
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Object} Password reset result
   */
  static async resetPassword(token, newPassword) {
    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
        isActive: true,
      });

      if (!user) {
        throw this.createAuthError('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
      }

      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      
      // Update password changed timestamp for admin users
      if (user.role === 'admin') {
        const admin = await Admin.findById(user._id);
        if (admin) {
          admin.passwordChangedAt = new Date();
          await admin.save();
        }
      }
      
      await user.save();

      logger.info(`Password reset successfully for: ${user.email}`);
      return {
        message: 'Password reset successfully',
      };
    } catch (error) {
      if (error.code) throw error;
      logger.error('Password reset failed:', error.message);
      throw this.createAuthError('Password reset failed', 'PASSWORD_RESET_FAILED');
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} Password change result
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw this.createAuthError('User not found', 'USER_NOT_FOUND');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw this.createAuthError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
      }

      user.password = newPassword;
      
      // Update password changed timestamp for admin users
      if (user.role === 'admin') {
        const admin = await Admin.findById(user._id);
        if (admin) {
          admin.passwordChangedAt = new Date();
          admin.mustChangePassword = false;
          await admin.save();
        }
      }
      
      await user.save();

      logger.info(`Password changed successfully for user: ${user.email}`);
      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error.code) throw error;
      logger.error('Password change failed:', error.message);
      throw this.createAuthError('Password change failed', 'PASSWORD_CHANGE_FAILED');
    }
  }

  /**
   * Logout user (invalidate tokens)
   * @param {string} userId - User ID
   * @param {string} token - Access token to invalidate
   * @returns {Object} Logout result
   */
  static async logout(userId, token) {
    try {
      // For admin users, invalidate session
      const user = await User.findById(userId);
      if (user && user.role === 'admin') {
        const admin = await Admin.findById(userId);
        if (admin) {
          await admin.invalidateSession();
          await admin.logActivity('LOGOUT', null, null, { token: token.substring(0, 10) + '...' });
        }
      }

      // In a production environment, you might want to maintain a blacklist of invalidated tokens
      // For now, we'll just log the logout
      logger.info(`User logged out: ${userId}`);
      return {
        message: 'Logged out successfully',
      };
    } catch (error) {
      logger.error('Logout failed:', error.message);
      throw this.createAuthError('Logout failed', 'LOGOUT_FAILED');
    }
  }

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Object} User profile
   */
  static async getUserProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        throw this.createAuthError('User not found', 'USER_NOT_FOUND');
      }

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (error.code) throw error;
      logger.error('Get user profile failed:', error.message);
      throw this.createAuthError('Failed to get user profile', 'PROFILE_FETCH_FAILED');
    }
  }

  // Helper methods

  /**
   * Generate verification token
   * @returns {string} Verification token
   */
  static generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate password reset token
   * @returns {string} Password reset token
   */
  static generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get token expiration time in seconds
   * @param {string} expiresIn - JWT expires in format
   * @returns {number} Expiration time in seconds
   */
  static getTokenExpirationTime(expiresIn) {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 3600);
  }

  /**
   * Create authentication error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {Error} Authentication error
   */
  static createAuthError(message, code) {
    const error = new Error(message);
    error.code = code;
    error.status = 401;
    return error;
  }
}

module.exports = AuthService;