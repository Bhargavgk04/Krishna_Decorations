const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');

let mongoServer;
let request;

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test@1234',
  name: 'Test User',
  role: 'user'
};

const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'Admin@1234',
  name: 'Admin User',
  role: 'admin'
};

// Setup test database and server
const setupTestEnvironment = async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create test server
  request = supertest(app);
};

// Clean up after tests
const teardownTestEnvironment = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

// Generate JWT token for testing
const generateAuthToken = (user) => {
  return jwt.sign(
    { 
      id: user._id || 'test-user-id',
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Create test user in database
const createTestUser = async (userData = TEST_USER) => {
  const { User } = require('../../src/models');
  const hashedPassword = await require('bcryptjs').hash(userData.password, 8);
  return await User.create({
    ...userData,
    password: hashedPassword
  });
};

// Get authenticated request with token
const getAuthenticatedRequest = (token) => {
  return request.set('Authorization', `Bearer ${token}`);
};

module.exports = {
  setupTestEnvironment,
  teardownTestEnvironment,
  generateAuthToken,
  createTestUser,
  getAuthenticatedRequest,
  TEST_USER,
  ADMIN_USER,
  request
};
