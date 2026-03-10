module.exports = {
  // User roles
  USER_ROLES: {
    VISITOR: 'visitor',
    ADMIN: 'admin',
  },

  // Admin roles for staff management
  ADMIN_ROLES: ['admin', 'manager', 'super_admin'],

  // Admin permissions
  ADMIN_PERMISSIONS: [
    'view_dashboard',
    'manage_bookings',
    'view_statistics',
    'send_notifications',
    'manage_admins',
    'manage_users',
    'view_reports',
    'manage_settings',
  ],

  // Booking statuses
  BOOKING_STATUS: [
    'pending',
    'approved', 
    'modifications-requested',
    'completed',
    'cancelled'
  ],

  // Event types
  EVENT_TYPES: [
    'wedding',
    'birthday',
    'anniversary',
    'corporate',
    'engagement',
    'baby-shower',
    'other'
  ],

  // Decoration styles
  DECORATION_STYLES: {
    TRADITIONAL: 'traditional',
    MODERN: 'modern',
    RUSTIC: 'rustic',
    ELEGANT: 'elegant',
    BOHEMIAN: 'bohemian',
    MINIMALIST: 'minimalist',
    VINTAGE: 'vintage',
    CUSTOM: 'custom',
  },

  // File upload constants
  FILE_UPLOAD: {
    MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    ALLOWED_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg,image/webp').split(','),
    UPLOAD_PATHS: {
      REFERENCES: 'event-booking/references',
      GALLERY: 'event-booking/gallery',
    },
  },

  // JWT constants
  JWT: {
    EXPIRE: process.env.JWT_EXPIRE || '24h',
    REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // Error codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    ACCESS_DENIED: 'ACCESS_DENIED',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    DUPLICATE_ERROR: 'DUPLICATE_ERROR',
    FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ADMIN_NOT_FOUND: 'ADMIN_NOT_FOUND',
    ADMIN_ALREADY_EXISTS: 'ADMIN_ALREADY_EXISTS',
    BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    INVALID_DATE: 'INVALID_DATE',
    DATE_NOT_AVAILABLE: 'DATE_NOT_AVAILABLE',
    BOOKING_NOT_MODIFIABLE: 'BOOKING_NOT_MODIFIABLE',
    BOOKING_EXPIRED: 'BOOKING_EXPIRED',
    BOOKING_ALREADY_REJECTED: 'BOOKING_ALREADY_REJECTED',
    INVALID_OPERATION: 'INVALID_OPERATION',
  },

  // Email templates
  EMAIL_TEMPLATES: {
    BOOKING_CONFIRMATION: 'booking-confirmation',
    BOOKING_APPROVED: 'booking-approved',
    BOOKING_REJECTED: 'booking-rejected',
    BOOKING_MODIFICATIONS: 'booking-modifications',
    WELCOME: 'welcome',
  },

  // WhatsApp message templates
  WHATSAPP_TEMPLATES: {
    BOOKING_CONFIRMATION: 'booking_confirmation',
    BOOKING_STATUS_UPDATE: 'booking_status_update',
  },
};