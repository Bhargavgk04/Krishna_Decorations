const { body, param, query, validationResult } = require('express-validator');
const { EVENT_TYPES, BOOKING_STATUS, ADMIN_ROLES } = require('../config/constants');
const logger = require('./logger');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed:', {
      errors: errors.array(),
      path: req.path,
      method: req.method,
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value,
        })),
      },
    });
  }
  next();
};

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors,
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors,
];

/**
 * Password change validation
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors,
];

/**
 * Password reset validation
 */
const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors,
];

/**
 * Profile update validation
 */
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors,
];

/**
 * Booking validation
 */
const validateBookingRequest = (type) => {
  const baseValidation = [
    body('eventType')
      .isIn(Object.values(EVENT_TYPES))
      .withMessage(`Event type must be one of: ${Object.values(EVENT_TYPES).join(', ')}`),
    
    body('eventDate')
      .isISO8601()
      .toDate()
      .withMessage('Please provide a valid event date')
      .custom((value) => {
        const eventDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (eventDate < today) {
          throw new Error('Event date must be in the future');
        }
        return true;
      }),
    
    body('eventTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Please provide a valid time in HH:MM format'),
    
    body('venue')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Venue must be between 5 and 200 characters'),
    
    body('guestCount')
      .isInt({ min: 1, max: 10000 })
      .withMessage('Guest count must be between 1 and 10,000'),
    
    body('decorationStyle')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Decoration style cannot exceed 100 characters'),
    
    body('specialRequests')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Special requests cannot exceed 2000 characters'),
  ];

  const statusUpdateValidation = [
    body('status')
      .isIn(Object.values(BOOKING_STATUS))
      .withMessage(`Status must be one of: ${Object.values(BOOKING_STATUS).join(', ')}`),
    
    body('comments')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Comments cannot exceed 1000 characters'),
    
    body('totalAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Total amount must be a positive number'),
  ];

  switch (type) {
    case 'create':
      return [...baseValidation, handleValidationErrors];
    case 'update':
      return [
        ...baseValidation.map(validation => validation.optional()),
        handleValidationErrors,
      ];
    case 'statusUpdate':
      return [...statusUpdateValidation, handleValidationErrors];
    default:
      return [handleValidationErrors];
  }
};

/**
 * Admin validation
 */
const validateAdminRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('role')
    .isIn(ADMIN_ROLES)
    .withMessage(`Role must be one of: ${ADMIN_ROLES.join(', ')}`),
  
  body('department')
    .optional()
    .isIn(['operations', 'sales', 'design', 'management', 'support'])
    .withMessage('Department must be one of: operations, sales, design, management, support'),
  
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors,
];

/**
 * Admin update validation
 */
const validateAdminUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('role')
    .optional()
    .isIn(ADMIN_ROLES)
    .withMessage(`Role must be one of: ${ADMIN_ROLES.join(', ')}`),
  
  body('department')
    .optional()
    .isIn(['operations', 'sales', 'design', 'management', 'support'])
    .withMessage('Department must be one of: operations, sales, design, management, support'),
  
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  handleValidationErrors,
];

/**
 * Notification validation
 */
const validateNotificationRequest = (type) => {
  const baseValidation = [
    body('bookingId')
      .isMongoId()
      .withMessage('Please provide a valid booking ID'),
    
    body('userId')
      .isMongoId()
      .withMessage('Please provide a valid user ID'),
    
    body('notificationTypes')
      .optional()
      .isArray()
      .withMessage('Notification types must be an array')
      .custom((types) => {
        const validTypes = ['email', 'whatsapp'];
        const invalidTypes = types.filter(type => !validTypes.includes(type));
        if (invalidTypes.length > 0) {
          throw new Error(`Invalid notification types: ${invalidTypes.join(', ')}`);
        }
        return true;
      }),
  ];

  const statusUpdateValidation = [
    ...baseValidation,
    body('oldStatus')
      .isIn(Object.values(BOOKING_STATUS))
      .withMessage(`Old status must be one of: ${Object.values(BOOKING_STATUS).join(', ')}`),
    
    body('adminComments')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Admin comments cannot exceed 1000 characters'),
  ];

  const adminNotificationValidation = [
    ...baseValidation,
    body('action')
      .isIn(['new_booking', 'booking_updated', 'booking_cancelled'])
      .withMessage('Action must be one of: new_booking, booking_updated, booking_cancelled'),
    
    body('adminEmail')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid admin email'),
    
    body('adminPhone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid admin phone number'),
  ];

  const eventReminderValidation = [
    ...baseValidation,
    body('daysUntilEvent')
      .isInt({ min: 0, max: 365 })
      .withMessage('Days until event must be between 0 and 365'),
  ];

  const bulkNotificationValidation = [
    body('recipients')
      .isArray({ min: 1 })
      .withMessage('Recipients must be a non-empty array'),
    
    body('message')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be between 1 and 2000 characters'),
    
    body('notificationType')
      .isIn(['email', 'whatsapp'])
      .withMessage('Notification type must be either email or whatsapp'),
    
    body('subject')
      .if(body('notificationType').equals('email'))
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Subject is required for email notifications and must be between 1 and 200 characters'),
  ];

  switch (type) {
    case 'bookingConfirmation':
      return [...baseValidation, handleValidationErrors];
    case 'bookingStatusUpdate':
      return [...statusUpdateValidation, handleValidationErrors];
    case 'adminNotification':
      return [...adminNotificationValidation, handleValidationErrors];
    case 'eventReminder':
      return [...eventReminderValidation, handleValidationErrors];
    case 'bulkNotifications':
      return [...bulkNotificationValidation, handleValidationErrors];
    default:
      return [handleValidationErrors];
  }
};

/**
 * Query parameter validation
 */
const validateQueryParams = (type) => {
  const paginationValidation = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ];

  const dateRangeValidation = [
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid start date'),
    
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid end date')
      .custom((value, { req }) => {
        if (req.query.dateFrom && value) {
          const startDate = new Date(req.query.dateFrom);
          const endDate = new Date(value);
          if (endDate < startDate) {
            throw new Error('End date must be after start date');
          }
        }
        return true;
      }),
  ];

  const bookingQueryValidation = [
    ...paginationValidation,
    ...dateRangeValidation,
    query('status')
      .optional()
      .isIn(Object.values(BOOKING_STATUS))
      .withMessage(`Status must be one of: ${Object.values(BOOKING_STATUS).join(', ')}`),
    
    query('eventType')
      .optional()
      .isIn(Object.values(EVENT_TYPES))
      .withMessage(`Event type must be one of: ${Object.values(EVENT_TYPES).join(', ')}`),
    
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'eventDate', 'status', 'eventType'])
      .withMessage('Sort by must be one of: createdAt, eventDate, status, eventType'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either asc or desc'),
    
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters'),
  ];

  const availabilityValidation = [
    query('eventDate')
      .isISO8601()
      .withMessage('Please provide a valid event date'),
    
    query('bookingId')
      .optional()
      .isMongoId()
      .withMessage('Please provide a valid booking ID'),
  ];

  switch (type) {
    case 'pagination':
      return [...paginationValidation, handleValidationErrors];
    case 'dateRange':
      return [...dateRangeValidation, handleValidationErrors];
    case 'bookingQuery':
      return [...bookingQueryValidation, handleValidationErrors];
    case 'availability':
      return [...availabilityValidation, handleValidationErrors];
    default:
      return [handleValidationErrors];
  }
};

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Please provide a valid ${paramName}`),
  
  handleValidationErrors,
];

/**
 * File upload validation
 */
const validateFileUpload = (fieldName, options = {}) => {
  const {
    maxFiles = 5,
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  } = options;

  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next(); // Files are optional
    }

    const errors = [];

    // Check number of files
    if (req.files.length > maxFiles) {
      errors.push({
        field: fieldName,
        message: `Maximum ${maxFiles} files allowed`,
      });
    }

    // Check each file
    req.files.forEach((file, index) => {
      // Check file size
      if (file.size > maxSize) {
        errors.push({
          field: `${fieldName}[${index}]`,
          message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
        });
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        errors.push({
          field: `${fieldName}[${index}]`,
          message: `File type must be one of: ${allowedTypes.join(', ')}`,
        });
      }
    });

    if (errors.length > 0) {
      logger.warn('File upload validation failed:', {
        errors,
        path: req.path,
        method: req.method,
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_VALIDATION_ERROR',
          message: 'File validation failed',
          details: errors,
        },
      });
    }

    next();
  };
};

/**
 * Sanitize input data
 */
const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else {
          obj[key] = sanitizeValue(obj[key]);
        }
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// Export specific validators for routes
const validateBooking = validateBookingRequest('create');
const validateBookingUpdate = validateBookingRequest('update');
const validateRegister = validateUserRegistration;
const validateLogin = validateUserLogin;

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange,
  validatePasswordReset,
  validateProfileUpdate,
  validateBookingRequest,
  validateAdminRegistration,
  validateAdminUpdate,
  validateNotificationRequest,
  validateQueryParams,
  validateObjectId,
  validateFileUpload,
  sanitizeInput,
  // Specific validators for routes
  validateBooking,
  validateBookingUpdate,
  validateRegister,
  validateLogin,
};