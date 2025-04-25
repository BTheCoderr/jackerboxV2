require('@testing-library/jest-dom');

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'test_stripe_key';
process.env.DATABASE_URL = 'test_db_url';

jest.mock('@/lib/db', () => ({
  db: {
    payment: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    rental: {
      update: jest.fn(),
    },
  },
}));

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 