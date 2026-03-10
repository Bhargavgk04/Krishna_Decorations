const logger = require('../utils/logger');
const { ERROR_CODES } = require('../config/constants');

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode, code = null, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle MongoDB cast errors
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, ERROR_CODES.INVALID_DATA);
};

/**
 * Handle MongoDB duplicate field errors
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists. Please use another value.`;
  return new AppError(message, 400, ERROR_CODES.DUPLICATE_FIELD);
};

/**
 * Handle MongoDB validation errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again!', 401, ERROR_CODES.INVALID_TOKEN);
};

/**
 * Handle JWT expired errors
 */
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired! Please log in again.', 401, ERROR_CODES.TOKEN_EXPIRED);
};

/**
 * Handle Multer errors
 */
const handleMulterError = (err) => {
  let message = 'File upload error';
  let code = ERROR_CODES.FILE_UPLOAD_ERROR;
  
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      message = 'File too large. Maximum size allowed is 5MB.';
      code = ERROR_CODES.FILE_TOO_LARGE;
      break;
    case 'LIMIT_FILE_COUNT':
      message = 'Too many files. Maximum 5 files allowed.';
      code = ERROR_CODES.TOO_MANY_FILES;
      break;
    case 'LIMIT_UNEXPECTED_FILE':
      message = 'Unexpected field name in file upload.';
      code = ERROR_CODES.UNEXPECTED_FILE_FIELD;
      break;
    default:
      message = err.message || 'File upload failed';
  }
  
  return new AppError(message, 400, code);
};

/**
 * Handle rate limit errors
 */
const handleRateLimitError = () => {
  return new AppError(
    'Too many requests from this IP, please try again later.',
    429,
    ERROR_CODES.RATE_LIMIT_EXCEEDED
  );
};

/**
 * Handle CORS errors
 */
const handleCORSError = () => {
  return new AppError(
    'Cross-Origin Request Blocked. This request is not allowed.',
    403,
    ERROR_CODES.CORS_ERROR
  );
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, req, res) => {
  // Log error details in development
  logger.error('Error in development:', {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.user?.id,
  });

  // API error response
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || ERROR_CODES.SERVER_ERROR,
        message: err.message,
        stack: err.stack,
        details: {
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  // Send JSON error response instead of rendering
  res.status(err.statusCode).json({
    success: false,
    error: {
      code: err.code || 'DEVELOPMENT_ERROR',
      message: err.message,
      stack: err.stack,
    },
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, req, res) => {
  // Log error details in production (without sensitive data)
  logger.error('Error in production:', {
    message: err.message,
    statusCode: err.statusCode,
    code: err.code,
    path: req.path,
    method: req.method,
    user: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    isOperational: err.isOperational,
  });

  // API error response
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code || ERROR_CODES.SERVER_ERROR,
          message: err.message,
        },
      });
    }

    // Programming or other unknown error: don't leak error details
    logger.error('Programming error:', err);
    
    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Something went wrong!',
      },
    });
  }

  // Rendered website error
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }

  // Programming or other unknown error: send generic message
  logger.error('Programming error:', err);
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

/**
 * Global error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);
    if (error.message && error.message.includes('rate limit')) error = handleRateLimitError();
    if (error.message && error.message.includes('CORS')) error = handleCORSError();

    sendErrorProd(error, req, res);
  }
};

/**
 * Handle unhandled routes
 */
const handleNotFound = (req, res, next) => {
  const message = `Can't find ${req.originalUrl} on this server!`;
  const error = new AppError(message, 404, ERROR_CODES.ROUTE_NOT_FOUND);
  
  logger.warn('Route not found:', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  
  next(error);
};

/**
 * Async error wrapper
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
      error: err.message,
      stack: err.stack,
    });
    
    process.exit(1);
  });
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = (server) => {
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
      error: err.message,
      stack: err.stack,
    });
    
    server.close(() => {
      process.exit(1);
    });
  });
};

/**
 * Handle SIGTERM signal
 */
const handleSIGTERM = (server) => {
  process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
    
    server.close(() => {
      logger.info('💥 Process terminated!');
    });
  });
};

/**
 * Validation error formatter
 */
const formatValidationError = (errors) => {
  return errors.map(error => ({
    field: error.path || error.param,
    message: error.msg || error.message,
    value: error.value,
  }));
};

/**
 * Database error formatter
 */
const formatDatabaseError = (error) => {
  const formattedError = {
    type: error.name,
    message: error.message,
  };

  if (error.code === 11000) {
    formattedError.type = 'DuplicateError';
    formattedError.field = Object.keys(error.keyValue)[0];
    formattedError.value = error.keyValue[formattedError.field];
  }

  if (error.name === 'ValidationError') {
    formattedError.errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));
  }

  return formattedError;
};

/**
 * Create standardized error response
 */
const createErrorResponse = (error, req) => {
  const response = {
    success: false,
    error: {
      code: error.code || ERROR_CODES.SERVER_ERROR,
      message: error.message,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  // Add request ID if available
  if (req.id) {
    response.requestId = req.id;
  }

  // Add validation details if available
  if (error.details) {
    response.error.details = error.details;
  }

  return response;
};

/**
 * Log error with context
 */
const logErrorWithContext = (error, req, context = {}) => {
  const logData = {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      userType: req.user.userType,
    } : null,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (error.statusCode >= 500) {
    logger.error('Server error:', logData);
  } else {
    logger.warn('Client error:', logData);
  }
};

/**
 * Health check error handler
 */
const healthCheckErrorHandler = (error) => {
  logger.error('Health check failed:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  return {
    status: 'error',
    message: error.message,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  AppError,
  globalErrorHandler,
  handleNotFound,
  catchAsync,
  handleUncaughtException,
  handleUnhandledRejection,
  handleSIGTERM,
  formatValidationError,
  formatDatabaseError,
  createErrorResponse,
  logErrorWithContext,
  healthCheckErrorHandler,
};