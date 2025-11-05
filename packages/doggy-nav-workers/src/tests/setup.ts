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

// Provide crypto polyfill for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
  writable: true,
  configurable: true,
});

export {};
