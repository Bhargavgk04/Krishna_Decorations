const {
  setupTestEnvironment,
  teardownTestEnvironment,
  TEST_USER,
  ADMIN_USER,
  request,
  createTestUser,
  getAuthenticatedRequest
} = require('../test-utils');

describe('Bookings API', () => {
  let userToken;
  let adminToken;
  let testBooking;

  beforeAll(async () => {
    await setupTestEnvironment();
    
    // Create test users
    const user = await createTestUser();
    const admin = await createTestUser(ADMIN_USER);
    
    // Get auth tokens
    const userLogin = await request
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    userToken = userLogin.body.token;

    const adminLogin = await request
      .post('/api/auth/login')
      .send({ email: ADMIN_USER.email, password: ADMIN_USER.password });
    adminToken = adminLogin.body.token;

    // Create a test booking
    const bookingData = {
      eventType: 'wedding',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      guestCount: 100,
      location: 'Test Venue',
      specialRequests: 'Test special requests',
      status: 'pending'
    };

    const res = await getAuthenticatedRequest(userToken)
      .post('/api/bookings')
      .send(bookingData);
    
    testBooking = res.body;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const bookingData = {
        eventType: 'birthday',
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        guestCount: 50,
        location: 'Test Venue 2',
        specialRequests: 'Another test booking'
      };

      const res = await getAuthenticatedRequest(userToken)
        .post('/api/bookings')
        .send(bookingData);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        eventType: 'birthday',
        guestCount: 50,
        location: 'Test Venue 2',
        status: 'pending'
      });
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('user');
    });
  });

  describe('GET /api/bookings', () => {
    it('should get all bookings for admin', async () => {
      const res = await getAuthenticatedRequest(adminToken)
        .get('/api/bookings');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should get only user\'s own bookings for regular user', async () => {
      const res = await getAuthenticatedRequest(userToken)
        .get('/api/bookings');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Should only return bookings for the authenticated user
      const allUsersSame = res.body.every(booking => 
        booking.user === testBooking.user
      );
      expect(allUsersSame).toBe(true);
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should get a booking by ID', async () => {
      const res = await getAuthenticatedRequest(userToken)
        .get(`/api/bookings/${testBooking._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id', testBooking._id);
      expect(res.body).toHaveProperty('eventType', testBooking.eventType);
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId but doesn't exist
      const res = await getAuthenticatedRequest(userToken)
        .get(`/api/bookings/${nonExistentId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/bookings/:id', () => {
    it('should update a booking', async () => {
      const updates = {
        guestCount: 120,
        specialRequests: 'Updated special requests'
      };

      const res = await getAuthenticatedRequest(userToken)
        .put(`/api/bookings/${testBooking._id}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        _id: testBooking._id,
        guestCount: 120,
        specialRequests: 'Updated special requests'
      });
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    it('should delete a booking', async () => {
      // First create a booking to delete
      const bookingData = {
        eventType: 'corporate',
        eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        guestCount: 200,
        location: 'Test Venue 3'
      };

      const createRes = await getAuthenticatedRequest(userToken)
        .post('/api/bookings')
        .send(bookingData);

      const deleteRes = await getAuthenticatedRequest(userToken)
        .delete(`/api/bookings/${createRes.body._id}`);

      expect(deleteRes.status).toBe(204);

      // Verify it's deleted
      const getRes = await getAuthenticatedRequest(userToken)
        .get(`/api/bookings/${createRes.body._id}`);
      
      expect(getRes.status).toBe(404);
    });
  });

  describe('Admin Operations', () => {
    it('should allow admin to update any booking status', async () => {
      const updates = {
        status: 'confirmed',
        adminNotes: 'Booking confirmed by admin'
      };

      const res = await getAuthenticatedRequest(adminToken)
        .put(`/api/bookings/${testBooking._id}/status`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        _id: testBooking._id,
        status: 'confirmed',
        adminNotes: 'Booking confirmed by admin'
      });
    });
  });
});
