const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { ERROR_CODES } = require('../config/constants');

class JWTService {
  /**
   * Generate access token
   * @param {Object} payload - Token payload
   * @param {string} secret - JWT secret
   * @param {string} expiresIn - Token expiration time
   */
  static generateAccessToken(payload, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRES_IN || '15m') {
    try {
      if (!secret) {
        throw new Error('JWT secret is not configured');
      }

      return jwt.sign(payload, secret, {
        expiresIn,
        issuer: 'krishna-decorations',
        audience: 'krishna-decorations-users',
      });
    } catch (error) {
      logger.error('Failed to generate access token:', error);
      throw this.createJWTError('Failed to generate access token', 'TOKEN_GENERATION_FAILED');
    }
  }

  /**
   * Generate refresh token
   * @param {Object} payload - Token payload
   * @param {string} secret - JWT secret
   * @param {string} expiresIn - Token expiration time
   */
  static generateRefreshToken(payload, secret = process.env.JWT_REFRESH_SECRET, expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d') {
    try {
      if (!secret) {
        throw new Error('JWT refresh secret is not configured');
      }

      return jwt.sign(payload, secret, {
        expiresIn,
        issuer: 'krishna-decorations',
        audience: 'krishna-decorations-refresh',
      });
    } catch (error) {
      logger.error('Failed to generate refresh token:', error);
      throw this.createJWTError('Failed to generate refresh token', 'REFRESH_TOKEN_GENERATION_FAILED');
    }
  }

  /**
   * Verify access token
   * @param {string} token - JWT token to verify
   * @param {string} secret - JWT secret
   */
  static verifyAccessToken(token, secret = process.env.JWT_SECRET) {
    try {
      if (!secret) {
        throw new Error('JWT secret is not configured');
      }

      if (!token) {
        throw new Error('Token is required');
      }

      return jwt.verify(token, secret, {
        issuer: 'krishna-decorations',
        audience: 'krishna-decorations-users',
      });
    } catch (error) {
      logger.error('Failed to verify access token:', {
        error: error.message,
        tokenProvided: !!token,
      });

      if (error.name === 'TokenExpiredError') {
        throw this.createJWTError('Access token has expired', 'TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw this.createJWTError('Invalid access token', 'INVALID_TOKEN');
      } else if (error.name === 'NotBeforeError') {
        throw this.createJWTError('Token not active yet', 'TOKEN_NOT_ACTIVE');
      }

      throw this.createJWTError('Token verification failed', 'TOKEN_VERIFICATION_FAILED');
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token to verify
   * @param {string} secret - JWT refresh secret
   */
  static verifyRefreshToken(token, secret = process.env.JWT_REFRESH_SECRET) {
    try {
      if (!secret) {
        throw new Error('JWT refresh secret is not configured');
      }

      if (!token) {
        throw new Error('Refresh token is required');
      }

      return jwt.verify(token, secret, {
        issuer: 'krishna-decorations',
        audience: 'krishna-decorations-refresh',
      });
    } catch (error) {
      logger.error('Failed to verify refresh token:', {
        error: error.message,
        tokenProvided: !!token,
      });

      if (error.name === 'TokenExpiredError') {
        throw this.createJWTError('Refresh token has expired', 'REFRESH_TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw this.createJWTError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }

      throw this.createJWTError('Refresh token verification failed', 'REFRESH_TOKEN_VERIFICATION_FAILED');
    }
  }

  /**
   * Generate token pair (access + refresh)
   * @param {Object} user - User object
   * @param {string} userType - Type of user ('user' or 'admin')
   */
  static generateTokenPair(user, userType = 'user') {
    try {
      const payload = {
        id: user._id,
        email: user.email,
        userType,
        role: user.role || 'user',
      };

      // Add additional fields for admin tokens
      if (userType === 'admin') {
        payload.permissions = user.permissions || [];
        payload.department = user.department;
      }

      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken({
        id: user._id,
        userType,
        tokenVersion: user.tokenVersion || 0,
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('Failed to generate token pair:', error);
      throw this.createJWTError('Failed to generate authentication tokens', 'TOKEN_PAIR_GENERATION_FAILED');
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token to decode
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   */
  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get token expiration:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   */
  static isTokenExpired(token) {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) return true;
      return expiration < new Date();
    } catch (error) {
      logger.error('Failed to check token expiration:', error);
      return true;
    }
  }

  /**
   * Generate password reset token
   * @param {Object} user - User object
   */
  static generatePasswordResetToken(user) {
    try {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      return {
        resetToken,
        hashedToken,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      };
    } catch (error) {
      logger.error('Failed to generate password reset token:', error);
      throw this.createJWTError('Failed to generate password reset token', 'RESET_TOKEN_GENERATION_FAILED');
    }
  }

  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @param {string} hashedToken - Stored hashed token
   */
  static verifyPasswordResetToken(token, hashedToken) {
    try {
      const hashedInputToken = crypto.createHash('sha256').update(token).digest('hex');
      return hashedInputToken === hashedToken;
    } catch (error) {
      logger.error('Failed to verify password reset token:', error);
      return false;
    }
  }

  /**
   * Generate email verification token
   * @param {Object} user - User object
   */
  static generateEmailVerificationToken(user) {
    try {
      const payload = {
        id: user._id,
        email: user.email,
        purpose: 'email_verification',
      };

      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h',
        issuer: 'krishna-decorations',
        audience: 'krishna-decorations-verification',
      });
    } catch (error) {
      logger.error('Failed to generate email verification token:', error);
      throw this.createJWTError('Failed to generate email verification token', 'EMAIL_VERIFICATION_TOKEN_FAILED');
    }
  }

  /**
   * Verify email verification token
   * @param {string} token - Email verification token
   */
  static verifyEmailVerificationToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'krishna-decorations',
        audience: 'krishna-decorations-verification',
      });
    } catch (error) {
      logger.error('Failed to verify email verification token:', error);
      
      if (error.name === 'TokenExpiredError') {
        throw this.createJWTError('Email verification token has expired', 'EMAIL_VERIFICATION_TOKEN_EXPIRED');
      }
      
      throw this.createJWTError('Invalid email verification token', 'INVALID_EMAIL_VERIFICATION_TOKEN');
    }
  }

  /**
   * Generate API key token
   * @param {Object} user - User object
   * @param {string} purpose - API key purpose
   */
  static generateAPIKeyToken(user, purpose = 'api_access') {
    try {
      const payload = {
        id: user._id,
        email: user.email,
        userType: user.role === 'admin' ? 'admin' : 'user',
        purpose,
        apiKey: true,
      };

      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '365d', // API keys last 1 year
        issuer: 'krishna-decorations',
        audience: 'krishna-decorations-api',
      });
    } catch (error) {
      logger.error('Failed to generate API key token:', error);
      throw this.createJWTError('Failed to generate API key token', 'API_KEY_GENERATION_FAILED');
    }
  }

  /**
   * Blacklist token (for logout)
   * @param {string} token - Token to blacklist
   */
  static async blacklistToken(token) {
    try {
      // In a real application, you would store blacklisted tokens in Redis or database
      // For now, we'll just log the action
      const decoded = this.decodeToken(token);
      logger.info('Token blacklisted:', {
        tokenId: decoded?.jti,
        userId: decoded?.payload?.id,
        expiresAt: decoded?.payload?.exp,
      });
      
      // TODO: Implement actual token blacklisting with Redis
      return true;
    } catch (error) {
      logger.error('Failed to blacklist token:', error);
      return false;
    }
  }

  /**
   * Check if token is blacklisted
   * @param {string} token - Token to check
   */
  static async isTokenBlacklisted(token) {
    try {
      // TODO: Implement actual blacklist checking with Redis
      return false;
    } catch (error) {
      logger.error('Failed to check token blacklist status:', error);
      return true; // Assume blacklisted on error for security
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @param {Object} user - User object (fetched using refresh token)
   */
  static refreshAccessToken(refreshToken, user) {
    try {
      // Verify refresh token first
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Check if user ID matches
      if (decoded.id !== user._id.toString()) {
        throw new Error('Token user mismatch');
      }

      // Check token version if implemented
      if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
        throw new Error('Token version mismatch');
      }

      // Generate new access token
      const userType = decoded.userType || 'user';
      const payload = {
        id: user._id,
        email: user.email,
        userType,
        role: user.role || 'user',
      };

      if (userType === 'admin') {
        payload.permissions = user.permissions || [];
        payload.department = user.department;
      }

      const accessToken = this.generateAccessToken(payload);

      return {
        accessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      throw this.createJWTError('Failed to refresh access token', 'TOKEN_REFRESH_FAILED');
    }
  }

  /**
   * Create JWT error
   * @param {string} message - Error message
   * @param {string} code - Error code
   */
  static createJWTError(message, code) {
    const error = new Error(message);
    error.code = code;
    error.status = 401;
    return error;
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Get token info without verification
   * @param {string} token - JWT token
   */
  static getTokenInfo(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded) return null;

      return {
        userId: decoded.id,
        email: decoded.email,
        userType: decoded.userType,
        role: decoded.role,
        issuedAt: decoded.iat ? new Date(decoded.iat * 1000) : null,
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null,
        issuer: decoded.iss,
        audience: decoded.aud,
      };
    } catch (error) {
      logger.error('Failed to get token info:', error);
      return null;
    }
  }
}

module.exports = JWTService;