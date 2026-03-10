const {
  setupTestEnvironment,
  teardownTestEnvironment,
  TEST_USER,
  request,
  createTestUser
} = require('../test-utils');

describe('Authentication API', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
    // Create a test user
    await createTestUser();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'NewUser@1234',
        role: 'user'
      };

      const res = await request
        .post('/api/auth/register')
        .send(newUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', newUser.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should not register with existing email', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: TEST_USER.email,
          password: 'Test@1234'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', TEST_USER.email);
    });

    it('should not login with invalid credentials', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      // First login to get token
      const loginRes = await request
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        });

      const token = loginRes.body.token;
      
      const res = await request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', TEST_USER.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should not get current user without token', async () => {
      const res = await request.get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
