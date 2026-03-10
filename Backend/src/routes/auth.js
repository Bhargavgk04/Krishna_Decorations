const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/security');
const {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange,
  validatePasswordReset,
  validateProfileUpdate,
  validateObjectId,
  sanitizeInput,
} = require('../utils/validators');

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authRateLimit);

// Apply input sanitization to all routes
router.use(sanitizeInput);

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateUserRegistration, AuthController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', validateUserLogin, AuthController.login);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh-token', AuthController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @route GET /api/auth/verify-email/:token
 * @desc Verify email address
 * @access Public
 */
router.get('/verify-email/:token', AuthController.verifyEmail);

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend email verification
 * @access Public
 */
router.post('/resend-verification', AuthController.resendEmailVerification);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', AuthController.requestPasswordReset);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password
 * @access Public
 */
router.post('/reset-password', validatePasswordReset, AuthController.resetPassword);

/**
 * @route POST /api/auth/change-password
 * @desc Change password (authenticated user)
 * @access Private
 */
router.post('/change-password', authenticate, validatePasswordChange, AuthController.changePassword);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticate, AuthController.getProfile);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticate, validateProfileUpdate, AuthController.updateProfile);

module.exports = router;