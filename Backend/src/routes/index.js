const express = require('express');
const authRoutes = require('./auth');
const bookingRoutes = require('./bookings');
const adminRoutes = require('./admin');

const whatsappService = require('../services/whatsappService');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const { validateQueryParams } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * API Health Check
 */
router.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.API_VERSION || '1.0.0',
    services: {
      database: 'connected', // This would be dynamic in real implementation
      email: process.env.EMAIL_SERVICE_ENABLED === 'true' ? 'enabled' : 'disabled',
      whatsapp: process.env.WHATSAPP_SERVICE_ENABLED === 'true' ? 'enabled' : 'disabled',
      cloudinary: process.env.CLOUDINARY_ENABLED === 'true' ? 'enabled' : 'disabled',
    },
  };

  logger.info('Health check requested:', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(200).json(healthCheck);
});

/**
 * API Information
 */
router.get('/info', (req, res) => {
  const apiInfo = {
    name: 'Krishna Decorations API',
    version: process.env.API_VERSION || '1.0.0',
    description: 'Event booking and decoration management system API',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      bookings: '/api/bookings',
      admin: '/api/admin',
      notifications: '/api/notifications',
      upload: '/api/upload',
      // whatsapp: '/api/whatsapp', // Disabled
    },
    features: [
      'User authentication and authorization',
      'Event booking management',
      'Admin panel functionality',
      'Email and WhatsApp notifications',
      'File upload and cloud storage',
      'Rate limiting and security',
    ],
    contact: {
      email: process.env.CONTACT_EMAIL || 'support@krishna-decorations.com',
      website: process.env.WEBSITE_URL || 'https://krishna-decorations.com',
    },
  };

  res.status(200).json(apiInfo);
});

/**
 * API Statistics (Admin only)
 */
router.get('/stats', 
  authenticate, 
  authorizeAdmin(),
  async (req, res) => {
    try {
      // This would typically fetch real statistics from database
      const stats = {
        requests: {
          total: 0, // Would be tracked in real implementation
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
        },
        users: {
          total: 0,
          active: 0,
          newThisMonth: 0,
        },
        bookings: {
          total: 0,
          pending: 0,
          approved: 0,
          completed: 0,
        },
        errors: {
          total: 0,
          today: 0,
          criticalErrors: 0,
        },
        performance: {
          averageResponseTime: '0ms',
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
        },
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get API statistics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FETCH_FAILED',
          message: 'Failed to fetch API statistics',
        },
      });
    }
  },
);

/**
 * API Routes
 */

// Authentication routes
router.use('/auth', authRoutes);

// Booking routes
router.use('/bookings', bookingRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// WhatsApp webhook routes
router.get('/whatsapp/webhook', whatsappService.verifyWebhook);
router.post('/whatsapp/webhook', whatsappService.handleWebhook);

/**
 * API Documentation placeholder
 */
router.get('/docs', (req, res) => {
  res.status(200).json({
    message: 'API Documentation',
    description: 'This would typically serve API documentation (Swagger/OpenAPI)',
    endpoints: {
      'GET /api/health': 'Health check endpoint',
      'GET /api/info': 'API information',
      'GET /api/stats': 'API statistics (Admin only)',
      'POST /api/auth/register': 'User registration',
      'POST /api/auth/login': 'User login',
      'POST /api/bookings': 'Create booking',
      'GET /api/bookings/my-bookings': 'Get user bookings',
      'POST /api/admin/login': 'Admin login',
      'GET /api/admin/dashboard': 'Admin dashboard',
      // Add more endpoints as needed
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
    },
    rateLimit: {
      general: '100 requests per 15 minutes',
      auth: '5 requests per 15 minutes',
      upload: '20 requests per hour',
    },
  });
});

/**
 * Test endpoints (Development only)
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/test/error', (req, res, next) => {
    const error = new Error('Test error for development');
    error.statusCode = 500;
    next(error);
  });

  router.get('/test/validation', 
    validateQueryParams('pagination'),
    (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Validation test passed',
        query: req.query,
      });
    },
  );

  router.get('/test/auth', authenticate, (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Authentication test passed',
      user: req.user,
    });
  });

  router.get('/test/admin', 
    authenticate, 
    authorizeAdmin(),
    (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Admin authorization test passed',
        admin: req.user,
      });
    },
  );
}

/**
 * API Version middleware
 */
router.use((req, res, next) => {
  res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');
  next();
});

/**
 * Request timing middleware removed - causing headers already sent error
 */
// router.use((req, res, next) => { ... });

module.exports = router;