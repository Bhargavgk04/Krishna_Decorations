const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Admin, ADMIN_PERMISSIONS } = require('../../../src/models/Admin');
const User = require('../../../src/models/User');
const { USER_ROLES } = require('../../../src/config/constants');

describe('Admin Model', () => {
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

  describe('Admin Creation', () => {
    it('should create a valid admin', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '+1234567890',
        password: 'adminpass123',
        department: 'Operations',
        employeeId: 'EMP001',
      };

      const admin = new Admin(adminData);
      const savedAdmin = await admin.save();

      expect(savedAdmin.name).toBe(adminData.name);
      expect(savedAdmin.email).toBe(adminData.email);
      expect(savedAdmin.role).toBe(USER_ROLES.ADMIN);
      expect(savedAdmin.isVerified).toBe(true);
      expect(savedAdmin.department).toBe('Operations');
      expect(savedAdmin.employeeId).toBe('EMP001');
      expect(savedAdmin.maxLoginAttempts).toBe(3);
      expect(savedAdmin.twoFactorEnabled).toBe(false);
    });

    it('should create admin with default permissions', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '+1234567890',
        password: 'adminpass123',
      };

      const admin = await Admin.createAdmin(adminData);

      expect(admin.permissions).toContain(ADMIN_PERMISSIONS.MANAGE_BOOKINGS);
      expect(admin.permissions).toContain(ADMIN_PERMISSIONS.VIEW_ANALYTICS);
      expect(admin.role).toBe(USER_ROLES.ADMIN);
      expect(admin.isVerified).toBe(true);
    });

    it('should create admin with custom permissions', async () => {
      const adminData = {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        phone: '+1234567891',
        password: 'superpass123',
      };

      const customPermissions = [ADMIN_PERMISSIONS.SUPER_ADMIN, ADMIN_PERMISSIONS.MANAGE_USERS];
      const admin = await Admin.createAdmin(adminData, customPermissions);

      expect(admin.permissions).toContain(ADMIN_PERMISSIONS.SUPER_ADMIN);
      expect(admin.permissions).toContain(ADMIN_PERMISSIONS.MANAGE_USERS);
      expect(admin.permissions).toContain(ADMIN_PERMISSIONS.MANAGE_BOOKINGS);
      expect(admin.permissions).toContain(ADMIN_PERMISSIONS.VIEW_ANALYTICS);
    });

    it('should validate employee ID uniqueness', async () => {
      const adminData1 = {
        name: 'Admin One',
        email: 'admin1@example.com',
        phone: '+1234567890',
        password: 'adminpass123',
        employeeId: 'EMP001',
      };

      const adminData2 = {
        name: 'Admin Two',
        email: 'admin2@example.com',
        phone: '+1234567891',
        password: 'adminpass456',
        employeeId: 'EMP001', // Same employee ID
      };

      await Admin.create(adminData1);

      let error;
      try {
        await Admin.create(adminData2);
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe('DUPLICATE_ERROR'); // Custom duplicate error from User model
    });

    it('should validate IP address format', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '+1234567890',
        password: 'adminpass123',
        lastLoginIP: 'invalid-ip',
      };

      const admin = new Admin(adminData);

      let error;
      try {
        await admin.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.lastLoginIP).toBeDefined();
    });

    it('should accept valid IP addresses', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '+1234567890',
        password: 'adminpass123',
        lastLoginIP: '192.168.1.1',
      };

      const admin = new Admin(adminData);
      const savedAdmin = await admin.save();

      expect(savedAdmin.lastLoginIP).toBe('192.168.1.1');
    });
  });

  describe('Permission Management', () => {
    let testAdmin;

    beforeEach(async () => {
      testAdmin = await Admin.createAdmin({
        name: 'Test Admin',
        email: 'testadmin@example.com',
        phone: '+1234567890',
        password: 'testpass123',
      });
    });

    it('should check permissions correctly', () => {
      expect(testAdmin.hasPermission(ADMIN_PERMISSIONS.MANAGE_BOOKINGS)).toBe(true);
      expect(testAdmin.hasPermission(ADMIN_PERMISSIONS.MANAGE_USERS)).toBe(false);
    });

    it('should grant super admin all permissions', async () => {
      await testAdmin.addPermission(ADMIN_PERMISSIONS.SUPER_ADMIN);

      expect(testAdmin.hasPermission(ADMIN_PERMISSIONS.MANAGE_USERS)).toBe(true);
      expect(testAdmin.hasPermission(ADMIN_PERMISSIONS.MANAGE_GALLERY)).toBe(true);
      expect(testAdmin.hasPermission(ADMIN_PERMISSIONS.MANAGE_SETTINGS)).toBe(true);
    });

    it('should add permissions', async () => {
      await testAdmin.addPermission(ADMIN_PERMISSIONS.MANAGE_USERS);

      expect(testAdmin.permissions).toContain(ADMIN_PERMISSIONS.MANAGE_USERS);
      expect(testAdmin.hasPermission(ADMIN_PERMISSIONS.MANAGE_USERS)).toBe(true);
    });

    it('should not add duplicate permissions', async () => {
      const initialLength = testAdmin.permissions.length;
      await testAdmin.addPermission(ADMIN_PERMISSIONS.MANAGE_BOOKINGS); // Already exists

      expect(testAdmin.permissions.length).toBe(initialLength);
    });

    it('should remove permissions', async () => {
      await testAdmin.removePermission(ADMIN_PERMISSIONS.MANAGE_BOOKINGS);

      expect(testAdmin.permissions).not.toContain(ADMIN_PERMISSIONS.MANAGE_BOOKINGS);
      expect(testAdmin.hasPermission(ADMIN_PERMISSIONS.MANAGE_BOOKINGS)).toBe(false);
    });
  });

  describe('Activity Logging', () => {
    let testAdmin;

    beforeEach(async () => {
      testAdmin = await Admin.createAdmin({
        name: 'Test Admin',
        email: 'testadmin@example.com',
        phone: '+1234567890',
        password: 'testpass123',
      });
    });

    it('should log activity', async () => {
      await testAdmin.logActivity(
        'APPROVE_BOOKING',
        'booking',
        new mongoose.Types.ObjectId(),
        { status: 'approved' },
        '192.168.1.1'
      );

      expect(testAdmin.activityLog).toHaveLength(1);
      expect(testAdmin.activityLog[0].action).toBe('APPROVE_BOOKING');
      expect(testAdmin.activityLog[0].resource).toBe('booking');
      expect(testAdmin.activityLog[0].details.status).toBe('approved');
      expect(testAdmin.activityLog[0].ipAddress).toBe('192.168.1.1');
    });

    it('should update last activity timestamp', async () => {
      const originalActivity = testAdmin.lastActivity;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await testAdmin.logActivity('VIEW_DASHBOARD');

      expect(testAdmin.lastActivity.getTime()).toBeGreaterThan(originalActivity.getTime());
    });
  });

  describe('Login Management', () => {
    let testAdmin;

    beforeEach(async () => {
      testAdmin = await Admin.createAdmin({
        name: 'Test Admin',
        email: 'testadmin@example.com',
        phone: '+1234567890',
        password: 'testpass123',
      });
    });

    it('should record successful login', async () => {
      await testAdmin.recordLogin(true, '192.168.1.1', 'Mozilla/5.0');

      expect(testAdmin.loginHistory).toHaveLength(1);
      expect(testAdmin.loginHistory[0].success).toBe(true);
      expect(testAdmin.loginHistory[0].ipAddress).toBe('192.168.1.1');
      expect(testAdmin.loginHistory[0].userAgent).toBe('Mozilla/5.0');
      expect(testAdmin.lastLoginIP).toBe('192.168.1.1');
    });

    it('should record failed login', async () => {
      await testAdmin.recordLogin(false, '192.168.1.1', 'Mozilla/5.0', 'Invalid password');

      expect(testAdmin.loginHistory).toHaveLength(1);
      expect(testAdmin.loginHistory[0].success).toBe(false);
      expect(testAdmin.loginHistory[0].failureReason).toBe('Invalid password');
    });

    it('should increment login attempts on failed login', async () => {
      const initialAttempts = testAdmin.loginAttempts;
      await testAdmin.recordLogin(false, '192.168.1.1');

      const updatedAdmin = await Admin.findById(testAdmin._id);
      expect(updatedAdmin.loginAttempts).toBe(initialAttempts + 1);
    });
  });

  describe('Session Management', () => {
    let testAdmin;

    beforeEach(async () => {
      testAdmin = await Admin.createAdmin({
        name: 'Test Admin',
        email: 'testadmin@example.com',
        phone: '+1234567890',
        password: 'testpass123',
      });
    });

    it('should create session', async () => {
      await testAdmin.createSession();

      expect(testAdmin.sessionToken).toBeDefined();
      expect(testAdmin.sessionExpires).toBeDefined();
      expect(testAdmin.sessionExpires.getTime()).toBeGreaterThan(Date.now());
      expect(testAdmin.isSessionValid).toBe(true);
    });

    it('should create session with custom duration', async () => {
      const duration = 2 * 60 * 60 * 1000; // 2 hours
      await testAdmin.createSession(duration);

      const expectedExpiry = Date.now() + duration;
      expect(testAdmin.sessionExpires.getTime()).toBeCloseTo(expectedExpiry, -3); // Within 1 second
    });

    it('should invalidate session', async () => {
      await testAdmin.createSession();
      expect(testAdmin.sessionToken).toBeDefined();

      await testAdmin.invalidateSession();
      expect(testAdmin.sessionToken).toBeUndefined();
      expect(testAdmin.sessionExpires).toBeUndefined();
    });

    it('should detect expired session', async () => {
      await testAdmin.createSession(100); // 100ms duration
      
      // Wait for session to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(testAdmin.isSessionValid).toBe(false);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await Admin.createAdmin({
        name: 'Admin One',
        email: 'admin1@example.com',
        phone: '+1234567890',
        password: 'pass123',
      }, [ADMIN_PERMISSIONS.MANAGE_USERS]);

      await Admin.createAdmin({
        name: 'Admin Two',
        email: 'admin2@example.com',
        phone: '+1234567891',
        password: 'pass123',
      }, [ADMIN_PERMISSIONS.SUPER_ADMIN]);
    });

    it('should find admins by permission', async () => {
      const userManagers = await Admin.findByPermission(ADMIN_PERMISSIONS.MANAGE_USERS);
      expect(userManagers).toHaveLength(2); // One with explicit permission, one super admin

      const galleryManagers = await Admin.findByPermission(ADMIN_PERMISSIONS.MANAGE_GALLERY);
      expect(galleryManagers).toHaveLength(1); // Only super admin
    });

    it('should get activity statistics', async () => {
      const admin = await Admin.findOne({ email: 'admin1@example.com' });
      await admin.logActivity('APPROVE_BOOKING');
      await admin.logActivity('REJECT_BOOKING');

      const stats = await Admin.getActivityStats(30);
      expect(stats).toHaveLength(1);
      expect(stats[0].totalActions).toBe(2);
      expect(stats[0].actions).toHaveLength(2);
    });
  });

  describe('Virtual Properties', () => {
    it('should calculate password age', async () => {
      const admin = await Admin.createAdmin({
        name: 'Test Admin',
        email: 'testadmin@example.com',
        phone: '+1234567890',
        password: 'testpass123',
      });

      expect(admin.passwordAge).toBe(0); // Just created
    });
  });

  describe('JSON Transformation', () => {
    it('should exclude sensitive fields from JSON', async () => {
      const admin = await Admin.createAdmin({
        name: 'Test Admin',
        email: 'testadmin@example.com',
        phone: '+1234567890',
        password: 'testpass123',
      });

      await admin.createSession();
      admin.twoFactorSecret = 'secret123';
      admin.backupCodes = ['code1', 'code2'];

      const adminJSON = admin.toJSON();

      expect(adminJSON.sessionToken).toBeUndefined();
      expect(adminJSON.sessionExpires).toBeUndefined();
      expect(adminJSON.twoFactorSecret).toBeUndefined();
      expect(adminJSON.backupCodes).toBeUndefined();
      expect(adminJSON.password).toBeUndefined();
      expect(adminJSON.__v).toBeUndefined();
    });
  });
});