// Test setup file

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

// Global test configuration
beforeAll(() => {
  // Setup code that runs before all tests
});

afterAll(() => {
  // Cleanup code that runs after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

// Provide the Web Crypto API used by JWT and WebAuthn in the Worker runtime.
const nodeCrypto = require('node:crypto').webcrypto;
Object.defineProperty(global, 'crypto', {
  value: nodeCrypto,
  writable: true,
  configurable: true,
});

export {};
