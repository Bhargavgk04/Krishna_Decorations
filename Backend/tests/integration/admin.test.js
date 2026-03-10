const {
  setupTestEnvironment,
  teardownTestEnvironment,
  TEST_USER,
  ADMIN_USER,
  request,
  createTestUser,
  getAuthenticatedRequest
} = require('../test-utils');

describe('Admin API', () => {
  let adminToken;
  let userToken;
  let testUser;
  let testBooking;

  beforeAll(async () => {
    await setupTestEnvironment();
    
    // Create admin and regular user
    await createTestUser(ADMIN_USER);
    testUser = await createTestUser({
      name: 'Regular User',
      email: 'regular@example.com',
      password: 'Regular@1234',
      role: 'user'
    });
    
    // Get auth tokens
    const adminLogin = await request
      .post('/api/auth/login')
      .send({ email: ADMIN_USER.email, password: ADMIN_USER.password });
    adminToken = adminLogin.body.token;

    const userLogin = await request
      .post('/api/auth/login')
      .send({ email: 'regular@example.com', password: 'Regular@1234' });
    userToken = userLogin.body.token;

    // Create a test booking for the regular user
    const bookingData = {
      eventType: 'wedding',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      guestCount: 100,
      location: 'Test Venue'
    };

    const bookingRes = await getAuthenticatedRequest(userToken)
      .post('/api/bookings')
      .send(bookingData);
    
    testBooking = bookingRes.body;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('User Management', () => {
    it('should get all users (admin only)', async () => {
      const res = await getAuthenticatedRequest(adminToken)
        .get('/api/admin/users');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2); // At least admin and test user
      
      // Check user data is sanitized (no passwords)
      res.body.forEach(user => {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('tokens');
      });
    });

    it('should not allow regular users to list all users', async () => {
      const res = await getAuthenticatedRequest(userToken)
        .get('/api/admin/users');

      expect(res.status).toBe(403);
    });

    it('should get user by ID (admin only)', async () => {
      const res = await getAuthenticatedRequest(adminToken)
        .get(`/api/admin/users/${testUser._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id', testUser._id.toString());
      expect(res.body).not.toHaveProperty('password');
    });

    it('should update user role (admin only)', async () => {
      const res = await getAuthenticatedRequest(adminToken)
        .put(`/api/admin/users/${testUser._id}/role`)
        .send({ role: 'manager' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('role', 'manager');

      // Verify the change
      const updatedUser = await getAuthenticatedRequest(adminToken)
        .get(`/api/admin/users/${testUser._id}`);
      
      expect(updatedUser.body.role).toBe('manager');
    });

    it('should delete a user (admin only)', async () => {
      // First create a user to delete
      const newUser = await createTestUser({
        name: 'To Delete',
        email: 'delete@example.com',
        password: 'Delete@1234',
        role: 'user'
      });

      const res = await getAuthenticatedRequest(adminToken)
        .delete(`/api/admin/users/${newUser._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'User deleted successfully');

      // Verify deletion
      const getUserRes = await getAuthenticatedRequest(adminToken)
        .get(`/api/admin/users/${newUser._id}`);
      
      expect(getUserRes.status).toBe(404);
    });
  });

  describe('Booking Management', () => {
    it('should get all bookings (admin only)', async () => {
      const res = await getAuthenticatedRequest(adminToken)
        .get('/api/admin/bookings');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should update booking status (admin only)', async () => {
      const updates = {
        status: 'confirmed',
        adminNotes: 'Confirmed by admin test'
      };

      const res = await getAuthenticatedRequest(adminToken)
        .put(`/api/admin/bookings/${testBooking._id}/status`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'confirmed',
        adminNotes: 'Confirmed by admin test'
      });
    });

    it('should get booking statistics (admin only)', async () => {
      const res = await getAuthenticatedRequest(adminToken)
        .get('/api/admin/stats/bookings');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('byStatus');
      expect(res.body).toHaveProperty('byEventType');
    });
  });

  describe('System Status', () => {
    it('should get system status (admin only)', async () => {
      const res = await getAuthenticatedRequest(adminToken)
        .get('/api/admin/status');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('database');
      expect(res.body).toHaveProperty('memoryUsage');
      expect(res.body).toHaveProperty('uptime');
    });
  });
});
