const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AdminController = require('../../../src/controllers/adminController');
const { Admin, ADMIN_PERMISSIONS } = require('../../../src/models/Admin');
const User = require('../../../src/models/User');
const { USER_ROLES } = require('../../../src/config/constants');

// Mock AuthService
jest.mock('../../../src/services/authService', () => ({
  authenticateUser: jest.fn(),
  logout: jest.fn(),
  changePassword: jest.fn(),
}));

describe('AdminController', () => {
  let mongoServer;
  let testAdmin;
  let req;
  let res;

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
    
    // Create test admin
    testAdmin = await Admin.createAdmin({
      name: 'Test Admin',
      email: 'admin@example.com',
      phone: '+1234567890',
      password: 'adminpass123',
      department: 'IT',
      employeeId: 'EMP001',
    }, [ADMIN_PERMISSIONS.MANAGE_BOOKINGS, ADMIN_PERMISSIONS.VIEW_ANALYTICS]);

    // Mock request and response objects
    req = {
      body: {},
      query: {},
      params: {},
      user: { id: testAdmin._id, email: testAdmin.email, role: USER_ROLES.ADMIN },
      ip: '192.168.1.1',
      get: jest.fn(() => 'Mozilla/5.0'),
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login admin successfully', async () => {
      const AuthService = require('../../../src/services/authService');
      const mockAuthResult = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: testAdmin._id,
          email: testAdmin.email,
          role: USER_ROLES.ADMIN,
        },
      };
      
      AuthService.authenticateUser.mockResolvedValue(mockAuthResult);

      req.body = {
        email: 'admin@example.com',
        password: 'adminpass123',
      };

      await AdminController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Admin login successful',
        data: expect.objectContaining({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: expect.objectContaining({
            permissions: expect.arrayContaining([ADMIN_PERMISSIONS.MANAGE_BOOKINGS]),
            department: 'IT',
            employeeId: 'EMP001',
          }),
        }),
      });
    });

    it('should reject non-admin user', async () => {
      const AuthService = require('../../../src/services/authService');
      const mockAuthResult = {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: USER_ROLES.VISITOR, // Not admin
        },
      };
      
      AuthService.authenticateUser.mockResolvedValue(mockAuthResult);

      req.body = {
        email: 'user@example.com',
        password: 'password123',
      };

      await AdminController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Admin access required',
        },
      });
    });

    it('should handle password change requirement', async () => {
      const AuthService = require('../../../src/services/authService');
      const mockAuthResult = {
        user: {
          id: testAdmin._id,
          email: testAdmin.email,
          role: USER_ROLES.ADMIN,
        },
      };
      
      AuthService.authenticateUser.mockResolvedValue(mockAuthResult);

      // Set admin to require password change
      testAdmin.mustChangePassword = true;
      await testAdmin.save();

      req.body = {
        email: 'admin@example.com',
        password: 'adminpass123',
      };

      await AdminController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password change required',
        data: expect.objectContaining({
          mustChangePassword: true,
        }),
      });
    });
  });

  describe('getDashboard', () => {
    it('should get dashboard data successfully', async () => {
      await AdminController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          admin: expect.objectContaining({
            id: testAdmin._id,
            name: testAdmin.name,
            email: testAdmin.email,
            permissions: testAdmin.permissions,
          }),
          statistics: expect.objectContaining({
            users: expect.any(Object),
            bookings: expect.any(Object),
            adminActivity: expect.any(Array),
          }),
          recentActivity: expect.any(Array),
        }),
      });
    });

    it('should handle missing admin profile', async () => {
      req.user.id = new mongoose.Types.ObjectId(); // Non-existent admin

      await AdminController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: 'Admin profile not found',
        },
      });
    });
  });

  describe('getProfile', () => {
    it('should get admin profile successfully', async () => {
      await AdminController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: testAdmin._id,
          name: testAdmin.name,
          email: testAdmin.email,
          permissions: testAdmin.permissions,
          department: testAdmin.department,
          employeeId: testAdmin.employeeId,
        }),
      });
    });
  });

  describe('updateProfile', () => {
    it('should update admin profile successfully', async () => {
      req.body = {
        name: 'Updated Admin Name',
        department: 'Operations',
      };

      await AdminController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: expect.objectContaining({
          name: 'Updated Admin Name',
          department: 'Operations',
        }),
      });

      // Verify admin was actually updated
      const updatedAdmin = await Admin.findById(testAdmin._id);
      expect(updatedAdmin.name).toBe('Updated Admin Name');
      expect(updatedAdmin.department).toBe('Operations');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const AuthService = require('../../../src/services/authService');
      AuthService.changePassword.mockResolvedValue({ message: 'Password changed successfully' });

      req.body = {
        currentPassword: 'adminpass123',
        newPassword: 'newadminpass456',
        confirmNewPassword: 'newadminpass456',
      };

      await AdminController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully',
      });

      expect(AuthService.changePassword).toHaveBeenCalledWith(
        testAdmin._id,
        'adminpass123',
        'newadminpass456'
      );
    });
  });

  describe('getActivityLog', () => {
    it('should get activity log successfully', async () => {
      // Add some test activities
      await testAdmin.logActivity('LOGIN', null, null, null, '192.168.1.1');
      await testAdmin.logActivity('VIEW_DASHBOARD', null, null, null, '192.168.1.1');

      req.query = { page: 1, limit: 10 };

      await AdminController.getActivityLog(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          activities: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalPages: expect.any(Number),
            totalItems: expect.any(Number),
          }),
        }),
      });
    });
  });

  describe('logout', () => {
    it('should logout admin successfully', async () => {
      const AuthService = require('../../../src/services/authService');
      AuthService.logout.mockResolvedValue({ message: 'Logged out successfully' });

      req.token = 'mock-jwt-token';

      await AdminController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Admin logout successful',
      });

      expect(AuthService.logout).toHaveBeenCalledWith(testAdmin._id, 'mock-jwt-token');
    });
  });

  describe('createAdmin', () => {
    it('should create new admin successfully', async () => {
      // Make current admin a super admin
      await testAdmin.addPermission(ADMIN_PERMISSIONS.SUPER_ADMIN);

      req.body = {
        name: 'New Admin',
        email: 'newadmin@example.com',
        phone: '+1234567891',
        password: 'newadminpass123',
        permissions: [ADMIN_PERMISSIONS.MANAGE_BOOKINGS],
        department: 'HR',
        employeeId: 'EMP002',
      };

      await AdminController.createAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Admin created successfully',
        data: expect.objectContaining({
          name: 'New Admin',
          email: 'newadmin@example.com',
          permissions: expect.arrayContaining([ADMIN_PERMISSIONS.MANAGE_BOOKINGS]),
          department: 'HR',
          employeeId: 'EMP002',
        }),
      });

      // Verify admin was created
      const newAdmin = await Admin.findOne({ email: 'newadmin@example.com' });
      expect(newAdmin).toBeTruthy();
      expect(newAdmin.role).toBe(USER_ROLES.ADMIN);
    });

    it('should handle validation errors', async () => {
      req.body = {
        name: 'New Admin',
        // Missing required fields
      };

      await AdminController.createAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, email, phone, and password are required',
        },
      });
    });
  });
});