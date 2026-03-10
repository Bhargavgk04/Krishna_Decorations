const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../../src/models/User');
const { USER_ROLES } = require('../../../src/config/constants');

describe('User Model', () => {
  let mongoServer;

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
  });

  describe('User Creation', () => {
    it('should create a valid user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.phone).toBe(userData.phone);
      expect(savedUser.role).toBe(USER_ROLES.VISITOR);
      expect(savedUser.isVerified).toBe(false);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
    });

    it('should create an admin user', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '+1234567891',
        password: 'adminpass123',
        role: USER_ROLES.ADMIN,
      };

      const admin = await User.createAdmin(adminData);

      expect(admin.role).toBe(USER_ROLES.ADMIN);
      expect(admin.isVerified).toBe(true);
    });

    it('should require all mandatory fields', async () => {
      const user = new User({});

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.phone).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should validate email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '+1234567890',
        password: 'password123',
      };

      const user = new User(userData);

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    it('should validate phone format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: 'invalid-phone',
        password: 'password123',
      };

      const user = new User(userData);

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.phone).toBeDefined();
    });

    it('should enforce unique email', async () => {
      const userData1 = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
      };

      const userData2 = {
        name: 'Jane Doe',
        email: 'john@example.com', // Same email
        phone: '+1234567891',
        password: 'password456',
      };

      await User.create(userData1);

      let error;
      try {
        await User.create(userData2);
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe('DUPLICATE_EMAIL'); // Custom duplicate error
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should not rehash password if not modified', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
      };

      const user = await User.create(userData);
      const originalHash = user.password;

      user.name = 'John Updated';
      await user.save();

      expect(user.password).toBe(originalHash);
    });
  });

  describe('Password Comparison', () => {
    it('should compare password correctly', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
      };

      const user = await User.create(userData);
      const userWithPassword = await User.findByEmailWithPassword(user.email);

      const isMatch = await userWithPassword.comparePassword('password123');
      expect(isMatch).toBe(true);

      const isNotMatch = await userWithPassword.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });
  });

  describe('Login Attempts', () => {
    it('should increment login attempts', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
      };

      const user = await User.create(userData);
      
      await user.incLoginAttempts();
      const updatedUser = await User.findById(user._id);
      
      expect(updatedUser.loginAttempts).toBe(1);
    });

    it('should reset login attempts on successful login', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
      };

      const user = await User.create(userData);
      
      // Simulate failed attempts
      await user.incLoginAttempts();
      await user.incLoginAttempts();
      
      // Reset on successful login
      await user.resetLoginAttempts();
      const updatedUser = await User.findById(user._id);
      
      expect(updatedUser.loginAttempts).toBe(0);
      expect(updatedUser.lastLogin).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    it('should find user by email with password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
      };

      await User.create(userData);
      const user = await User.findByEmailWithPassword('john@example.com');

      expect(user).toBeDefined();
      expect(user.password).toBeDefined();
    });

    it('should get user statistics', async () => {
      // Create test users
      await User.create({
        name: 'Visitor 1',
        email: 'visitor1@example.com',
        phone: '+1234567890',
        password: 'password123',
      });

      await User.createAdmin({
        name: 'Admin 1',
        email: 'admin1@example.com',
        phone: '+1234567891',
        password: 'adminpass123',
      });

      const stats = await User.getUserStats();

      expect(stats[USER_ROLES.VISITOR]).toBeDefined();
      expect(stats[USER_ROLES.ADMIN]).toBeDefined();
      expect(stats[USER_ROLES.VISITOR].total).toBe(1);
      expect(stats[USER_ROLES.ADMIN].total).toBe(1);
    });
  });

  describe('JSON Transformation', () => {
    it('should exclude sensitive fields from JSON', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
      };

      const user = await User.create(userData);
      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.verificationToken).toBeUndefined();
      expect(userJSON.passwordResetToken).toBeUndefined();
      expect(userJSON.__v).toBeUndefined();
    });
  });
});