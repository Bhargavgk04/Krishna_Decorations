const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AuthService = require('../../../src/services/authService');
const User = require('../../../src/models/User');
const { Admin } = require('../../../src/models/Admin');
const { USER_ROLES } = require('../../../src/config/constants');

// Mock JWT for testing
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => {
    if (!payload || !secret) return undefined;
    return `mock-token-${payload.userId || payload.email || 'test'}`;
  }),
  verify: jest.fn((token, secret) => {
    if (!token || !secret) throw new Error('Invalid token');
    if (token.includes('invalid')) throw new Error('Invalid token');
    if (token.includes('expired')) {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      throw error;
    }
    return { userId: 'mock-user-id', email: 'test@example.com', role: 'visitor' };
  }),
}));

describe('AuthService', () => {
  let mongoServer;
  let testUser;
  let testAdmin;

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
      name: 'Test User',
      email: 'user@example.com',
      phone: '+1234567890',
      password: 'password123',
    });

    // Create test admin
    testAdmin = await Admin.createAdmin({
      name: 'Test Admin',
      email: 'admin@example.com',
      phone: '+1234567891',
      password: 'adminpass123',
    });
  });

  describe('Token Generation', () => {
    it('should generate access token', () => {
      const payload = { userId: 'test-id', email: 'test@example.com' };
      const token = AuthService.generateAccessToken(payload);
      
      expect(token).toBeDefined();
      expect(token).toContain('mock-token');
    });

    it('should generate refresh token', () => {
      const payload = { userId: 'test-id' };
      const token = AuthService.generateRefreshToken(payload);
      
      expect(token).toBeDefined();
      expect(token).toContain('mock-token');
    });

    it('should generate token pair', () => {
      const tokens = AuthService.generateTokenPair(testUser);
      
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('tokenType', 'Bearer');
      expect(tokens).toHaveProperty('expiresIn');
      expect(tokens).toHaveProperty('user');
      expect(tokens.user.email).toBe(testUser.email);
    });
  });

  describe('Token Verification', () => {
    it('should verify valid access token', () => {
      const decoded = AuthService.verifyAccessToken('valid-token');
      
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email');
    });

    it('should throw error for invalid access token', () => {
      expect(() => {
        AuthService.verifyAccessToken('invalid-token');
      }).toThrow('Invalid or expired access token');
    });

    it('should verify valid refresh token', () => {
      const decoded = AuthService.verifyRefreshToken('valid-refresh-token');
      
      expect(decoded).toHaveProperty('userId');
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        AuthService.verifyRefreshToken('invalid-refresh-token');
      }).toThrow('Invalid or expired refresh token');
    });
  });

  describe('User Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      const result = await AuthService.authenticateUser(
        'user@example.com',
        'password123',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('user@example.com');
    });

    it('should throw error for invalid email', async () => {
      await expect(
        AuthService.authenticateUser('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      await expect(
        AuthService.authenticateUser('user@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for locked account', async () => {
      // Lock the account
      testUser.lockUntil = new Date(Date.now() + 60000); // 1 minute from now
      await testUser.save();

      await expect(
        AuthService.authenticateUser('user@example.com', 'password123')
      ).rejects.toThrow('Account is temporarily locked');
    });

    it('should throw error for inactive account', async () => {
      testUser.isActive = false;
      await testUser.save();

      await expect(
        AuthService.authenticateUser('user@example.com', 'password123')
      ).rejects.toThrow('Account is deactivated');
    });

    it('should record login attempts for admin users', async () => {
      await AuthService.authenticateUser(
        'admin@example.com',
        'adminpass123',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      const admin = await Admin.findById(testAdmin._id);
      expect(admin.loginHistory).toHaveLength(1);
      expect(admin.loginHistory[0].success).toBe(true);
      expect(admin.sessionToken).toBeDefined();
    });
  });

  describe('User Registration', () => {
    it('should register new user', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        phone: '+1234567892',
        password: 'newpassword123',
      };

      const result = await AuthService.registerUser(userData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('verificationToken');
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.message).toContain('verify your email');
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'user@example.com', // Already exists
        phone: '+1234567893',
        password: 'password123',
      };

      await expect(
        AuthService.registerUser(userData)
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('Email Verification', () => {
    it('should verify email with valid token', async () => {
      const verificationToken = AuthService.generateVerificationToken();
      testUser.verificationToken = verificationToken;
      testUser.isVerified = false;
      await testUser.save();

      const result = await AuthService.verifyEmail(verificationToken);

      expect(result.message).toContain('verified successfully');
      expect(result.user.isVerified).toBe(true);

      // Check user is actually verified in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isVerified).toBe(true);
      expect(updatedUser.verificationToken).toBeUndefined();
    });

    it('should throw error for invalid verification token', async () => {
      await expect(
        AuthService.verifyEmail('invalid-token')
      ).rejects.toThrow('Invalid or expired verification token');
    });
  });

  describe('Password Reset', () => {
    it('should initiate password reset', async () => {
      const result = await AuthService.initiatePasswordReset('user@example.com');

      expect(result.message).toContain('reset link has been sent');
      expect(result).toHaveProperty('resetToken');

      // Check user has reset token
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.passwordResetToken).toBeDefined();
      expect(updatedUser.passwordResetExpires).toBeDefined();
    });

    it('should not reveal if email does not exist', async () => {
      const result = await AuthService.initiatePasswordReset('nonexistent@example.com');

      expect(result.message).toContain('If the email exists');
    });

    it('should reset password with valid token', async () => {
      const resetToken = AuthService.generatePasswordResetToken();
      testUser.passwordResetToken = resetToken;
      testUser.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
      await testUser.save();

      const result = await AuthService.resetPassword(resetToken, 'newpassword123');

      expect(result.message).toContain('reset successfully');

      // Verify password was changed
      const updatedUser = await User.findByEmailWithPassword('user@example.com');
      const isNewPasswordValid = await updatedUser.comparePassword('newpassword123');
      expect(isNewPasswordValid).toBe(true);
    });

    it('should throw error for invalid reset token', async () => {
      await expect(
        AuthService.resetPassword('invalid-token', 'newpassword123')
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw error for expired reset token', async () => {
      const resetToken = AuthService.generatePasswordResetToken();
      testUser.passwordResetToken = resetToken;
      testUser.passwordResetExpires = new Date(Date.now() - 3600000); // 1 hour ago
      await testUser.save();

      await expect(
        AuthService.resetPassword(resetToken, 'newpassword123')
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('Password Change', () => {
    it('should change password with valid current password', async () => {
      const result = await AuthService.changePassword(
        testUser._id,
        'password123',
        'newpassword456'
      );

      expect(result.message).toContain('changed successfully');

      // Verify password was changed
      const updatedUser = await User.findByEmailWithPassword('user@example.com');
      const isNewPasswordValid = await updatedUser.comparePassword('newpassword456');
      expect(isNewPasswordValid).toBe(true);
    });

    it('should throw error for incorrect current password', async () => {
      await expect(
        AuthService.changePassword(testUser._id, 'wrongpassword', 'newpassword456')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw error for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(
        AuthService.changePassword(fakeId, 'password123', 'newpassword456')
      ).rejects.toThrow('User not found');
    });

    it('should update password changed timestamp for admin users', async () => {
      const result = await AuthService.changePassword(
        testAdmin._id,
        'adminpass123',
        'newadminpass456'
      );

      expect(result.message).toContain('changed successfully');

      const updatedAdmin = await Admin.findById(testAdmin._id);
      expect(updatedAdmin.passwordChangedAt).toBeDefined();
      expect(updatedAdmin.mustChangePassword).toBe(false);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Mock the verify method to return the test user ID
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValueOnce({ userId: testUser._id });

      const result = await AuthService.refreshAccessToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(testUser.email);
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(
        AuthService.refreshAccessToken('invalid-refresh-token')
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw error if user not found during refresh', async () => {
      const jwt = require('jsonwebtoken');
      const fakeId = new mongoose.Types.ObjectId();
      jwt.verify.mockReturnValueOnce({ userId: fakeId });

      await expect(
        AuthService.refreshAccessToken('valid-refresh-token')
      ).rejects.toThrow('User not found or inactive');
    });
  });

  describe('User Profile', () => {
    it('should get user profile', async () => {
      const profile = await AuthService.getUserProfile(testUser._id);

      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('name', 'Test User');
      expect(profile).toHaveProperty('email', 'user@example.com');
      expect(profile).toHaveProperty('role', USER_ROLES.VISITOR);
      expect(profile).not.toHaveProperty('password');
    });

    it('should throw error for non-existent user profile', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(
        AuthService.getUserProfile(fakeId)
      ).rejects.toThrow('User not found');
    });
  });

  describe('Logout', () => {
    it('should logout user successfully', async () => {
      const result = await AuthService.logout(testUser._id, 'mock-token');

      expect(result.message).toContain('Logged out successfully');
    });

    it('should invalidate admin session on logout', async () => {
      // Create admin session first
      await testAdmin.createSession();
      expect(testAdmin.sessionToken).toBeDefined();

      await AuthService.logout(testAdmin._id, 'mock-admin-token');

      const updatedAdmin = await Admin.findById(testAdmin._id);
      expect(updatedAdmin.sessionToken).toBeUndefined();
    });
  });

  describe('Helper Methods', () => {
    it('should generate verification token', () => {
      const token = AuthService.generateVerificationToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate password reset token', () => {
      const token = AuthService.generatePasswordResetToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should calculate token expiration time', () => {
      expect(AuthService.getTokenExpirationTime('1h')).toBe(3600);
      expect(AuthService.getTokenExpirationTime('30m')).toBe(1800);
      expect(AuthService.getTokenExpirationTime('1d')).toBe(86400);
      expect(AuthService.getTokenExpirationTime('invalid')).toBe(3600); // Default
    });

    it('should create authentication error', () => {
      const error = AuthService.createAuthError('Test message', 'TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.status).toBe(401);
    });
  });
});