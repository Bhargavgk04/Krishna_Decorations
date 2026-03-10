const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  authenticate,
  authorize,
  authorizeAdmin,
  requireVerified,
  optionalAuth,
  authRateLimit,
  extractToken,
} = require('../../../src/middleware/auth');
const User = require('../../../src/models/User');
const { Admin, ADMIN_PERMISSIONS } = require('../../../src/models/Admin');
const { USER_ROLES } = require('../../../src/config/constants');

// Mock AuthService
jest.mock('../../../src/services/authService', () => ({
  verifyAccessToken: jest.fn((token) => {
    if (token === 'valid-token') {
      return { userId: 'mock-user-id', email: 'test@example.com', role: 'visitor' };
    }
    if (token === 'admin-token') {
      return { userId: 'mock-admin-id', email: 'admin@example.com', role: 'admin' };
    }
    if (token === 'expired-token') {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      throw error;
    }
    throw new Error('Invalid token');
  }),
}));

describe('Auth Middleware', () => {
  let mongoServer;
  let testUser;
  let testAdmin;
  let req;
  let res;
  let next;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      _id: 'mock-user-id',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'password123',
    });

    // Create test admin
    testAdmin = await Admin.createAdmin({
      _id: 'mock-admin-id',
      name: 'Test Admin',
      email: 'admin@example.com',
      phone: '+1234567891',
      password: 'adminpass123',
    }, [ADMIN_PERMISSIONS.MANAGE_BOOKINGS]);

    // Create admin session
    await testAdmin.createSession();

    // Mock request, response, and next
    req = {
      headers: {},
      ip: '192.168.1.1',
      user: null,
      admin: null,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      statusCode: 200,
    };

    next = jest.fn();
  });

  describe('extractToken', () => {
    it('should extract token from Authorization header', () => {
      req.headers.authorization = 'Bearer valid-token';
      const token = extractToken(req);
      expect(token).toBe('valid-token');
    });

    it('should return null for missing Authorization header', () => {
      const token = extractToken(req);
      expect(token).toBeNull();
    });

    it('should return null for invalid Authorization format', () => {
      req.headers.authorization = 'Invalid format';
      const token = extractToken(req);
      expect(token).toBeNull();
    });

    it('should return null for non-Bearer token', () => {
      req.headers.authorization = 'Basic dGVzdA==';
      const token = extractToken(req);
      expect(token).toBeNull();
    });
  });

  describe('authenticate middleware', () => {
    it('should authenticate user with valid token', async () => {
      req.headers.authorization = 'Bearer valid-token';

      await authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.email).toBe('test@example.com');
      expect(req.token).toBe('valid-token');
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Access token is required',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication failed',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', async () => {
      req.headers.authorization = 'Bearer expired-token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Token has expired',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request for inactive user', async () => {
      testUser.isActive = false;
      await testUser.save();

      req.headers.authorization = 'Bearer valid-token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'User not found or inactive',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request for locked user', async () => {
      testUser.lockUntil = new Date(Date.now() + 60000); // 1 minute from now
      await testUser.save();

      req.headers.authorization = 'Bearer valid-token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Account is temporarily locked',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should check admin session validity', async () => {
      // Invalidate admin session
      await testAdmin.invalidateSession();

      req.headers.authorization = 'Bearer admin-token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Admin session has expired',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    beforeEach(() => {
      req.user = { id: testUser._id, email: 'test@example.com', role: USER_ROLES.VISITOR };
    });

    it('should authorize user with correct role', () => {
      const middleware = authorize(USER_ROLES.VISITOR);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should authorize user with one of multiple allowed roles', () => {
      const middleware = authorize([USER_ROLES.VISITOR, USER_ROLES.ADMIN]);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject user with incorrect role', () => {
      const middleware = authorize(USER_ROLES.ADMIN);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request without authenticated user', () => {
      req.user = null;
      const middleware = authorize(USER_ROLES.VISITOR);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorizeAdmin middleware', () => {
    beforeEach(() => {
      req.user = { id: testAdmin._id, email: 'admin@example.com', role: USER_ROLES.ADMIN };
    });

    it('should authorize admin without specific permissions', async () => {
      const middleware = authorizeAdmin();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should authorize admin with required permission', async () => {
      const middleware = authorizeAdmin(ADMIN_PERMISSIONS.MANAGE_BOOKINGS);
      await middleware(req, res, next);

      expect(req.admin).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should authorize super admin for any permission', async () => {
      await testAdmin.addPermission(ADMIN_PERMISSIONS.SUPER_ADMIN);
      
      const middleware = authorizeAdmin(ADMIN_PERMISSIONS.MANAGE_USERS);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject admin without required permission', async () => {
      const middleware = authorizeAdmin(ADMIN_PERMISSIONS.MANAGE_USERS);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient admin permissions',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-admin user', async () => {
      req.user.role = USER_ROLES.VISITOR;
      
      const middleware = authorizeAdmin();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Admin access required',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireVerified middleware', () => {
    it('should allow verified user', () => {
      req.user = { id: testUser._id, isVerified: true };
      
      requireVerified(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject unverified user', () => {
      req.user = { id: testUser._id, isVerified: false };
      
      requireVerified(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Email verification required',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated user', () => {
      req.user = null;
      
      requireVerified(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should authenticate user with valid token', async () => {
      req.headers.authorization = 'Bearer valid-token';

      await optionalAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.email).toBe('test@example.com');
      expect(next).toHaveBeenCalled();
    });

    it('should continue without authentication when no token', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue without authentication when token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('authRateLimit middleware', () => {
    it('should allow requests within limit', () => {
      const middleware = authRateLimit(5, 60000); // 5 attempts per minute
      
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should block requests exceeding limit', () => {
      const middleware = authRateLimit(2, 60000); // 2 attempts per minute
      
      // First two requests should pass
      middleware(req, res, next);
      middleware(req, res, next);
      
      // Third request should be blocked
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts. Please try again later.',
        },
      });
    });

    it('should reset limit after time window', (done) => {
      const middleware = authRateLimit(1, 100); // 1 attempt per 100ms
      
      // First request should pass
      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      
      // Second request should be blocked
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(429);
      
      // After time window, request should pass again
      setTimeout(() => {
        middleware(req, res, next);
        expect(next).toHaveBeenCalledTimes(2);
        done();
      }, 150);
    });
  });
});