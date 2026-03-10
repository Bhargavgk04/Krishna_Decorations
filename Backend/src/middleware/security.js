const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const logger = require('../utils/logger');

/**
 * CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'https://krishna-decorations.com',
      'https://www.krishna-decorations.com',
      'https://admin.krishna-decorations.com',
    ];
    
    // Add environment-specific origins
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    if (process.env.ADMIN_FRONTEND_URL) {
      allowedOrigins.push(process.env.ADMIN_FRONTEND_URL);
    }

    // Normalize origins (remove trailing slashes)
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(ao => {
      if (!ao) return false;
      const normalizedAo = ao.trim().replace(/\/$/, '');
      return normalizedOrigin === normalizedAo;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from origin:', {
        origin,
        normalizedOrigin,
        allowedOrigins: allowedOrigins.filter(Boolean)
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

/**
 * Rate limiting configuration
 */
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded:', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
        },
      });
    },
  });
};

/**
 * General rate limiting
 */
const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.',
  true
);

/**
 * Auth rate limiting (stricter)
 */
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 auth requests per windowMs
  'Too many authentication attempts, please try again later.',
  false
);

/**
 * API rate limiting (for general API usage)
 */
const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  1000, // limit each IP to 1000 API requests per windowMs
  'API rate limit exceeded, please try again later.',
  true
);

/**
 * Upload rate limiting
 */
const uploadRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  20, // limit each IP to 20 upload requests per hour
  'Too many upload requests, please try again later.',
  false
);

/**
 * Speed limiting (slow down repeated requests)
 */
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 50
  maxDelayMs: 20000, // maximum delay of 20 seconds
  skipSuccessfulRequests: true,
});

/**
 * Helmet security configuration
 */
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://via.placeholder.com'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.cloudinary.com'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' },
};

/**
 * Compression configuration
 */
const compressionConfig = {
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
};

/**
 * MongoDB injection prevention
 */
const mongoSanitizeConfig = {
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('MongoDB injection attempt detected:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      key,
      userAgent: req.get('User-Agent'),
    });
  },
};

/**
 * HTTP Parameter Pollution prevention
 */
const hppConfig = {
  whitelist: [
    'page',
    'limit',
    'sort',
    'fields',
    'status',
    'eventType',
    'notificationTypes',
  ],
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Remove powered by header
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add API version header
  res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');
  
  next();
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length'),
    };
    
    if (req.user) {
      logData.userId = req.user.id;
      logData.userType = req.user.userType;
    }
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP request completed with error:', logData);
    } else {
      logger.info('HTTP request completed:', logData);
    }
  });
  
  next();
};

/**
 * IP whitelist middleware (for admin routes)
 */
const ipWhitelist = (whitelist = []) => {
  return (req, res, next) => {
    if (whitelist.length === 0) {
      return next(); // No whitelist configured
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (whitelist.includes(clientIP)) {
      return next();
    }
    
    logger.warn('IP not whitelisted:', {
      ip: clientIP,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(403).json({
      success: false,
      error: {
        code: 'IP_NOT_WHITELISTED',
        message: 'Access denied from this IP address',
      },
    });
  };
};

/**
 * Maintenance mode middleware
 */
const maintenanceMode = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    // Allow health check endpoints during maintenance
    if (req.path === '/health' || req.path === '/api/health') {
      return next();
    }
    
    logger.info('Request blocked due to maintenance mode:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    
    return res.status(503).json({
      success: false,
      error: {
        code: 'MAINTENANCE_MODE',
        message: 'System is currently under maintenance. Please try again later.',
        estimatedDowntime: process.env.MAINTENANCE_ETA || 'Unknown',
      },
    });
  }
  
  next();
};

/**
 * Content type validation middleware
 */
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    // Skip validation for GET requests and requests without body
    if (req.method === 'GET' || !req.body || Object.keys(req.body).length === 0) {
      return next();
    }
    
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CONTENT_TYPE',
          message: 'Content-Type header is required',
        },
      });
    }
    
    const isAllowed = allowedTypes.some(type => contentType.includes(type));
    
    if (!isAllowed) {
      logger.warn('Invalid content type:', {
        contentType,
        allowedTypes,
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      
      return res.status(415).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
        },
      });
    }
    
    next();
  };
};

/**
 * Request size limiting middleware
 */
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        logger.warn('Request size exceeded:', {
          contentLength: sizeInBytes,
          maxSize: maxSizeInBytes,
          ip: req.ip,
          path: req.path,
          method: req.method,
        });
        
        return res.status(413).json({
          success: false,
          error: {
            code: 'REQUEST_TOO_LARGE',
            message: `Request size exceeds maximum allowed size of ${maxSize}`,
          },
        });
      }
    }
    
    next();
  };
};

/**
 * Parse size string to bytes
 */
const parseSize = (size) => {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
};

module.exports = {
  // CORS
  cors: cors(corsOptions),
  
  // Rate limiting
  generalRateLimit,
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  speedLimiter,
  
  // Security
  helmet: helmet(helmetConfig),
  mongoSanitize: mongoSanitize(mongoSanitizeConfig),
  xss: xss(),
  hpp: hpp(hppConfig),
  compression: compression(compressionConfig),
  
  // Custom middleware
  securityHeaders,
  requestLogger,
  ipWhitelist,
  maintenanceMode,
  validateContentType,
  requestSizeLimit,
};