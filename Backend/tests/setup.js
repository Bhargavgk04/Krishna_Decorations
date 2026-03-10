// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.BCRYPT_SALT_ROUNDS = '4'; // Lower for faster tests

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs during tests unless explicitly needed
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up after tests
afterAll(async () => {
  // Restore console
  global.console = originalConsole;
});