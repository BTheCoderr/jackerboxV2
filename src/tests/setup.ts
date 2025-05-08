import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '../../.env') });

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    identity: {
      verificationSessions: {
        create: jest.fn().mockResolvedValue({
          id: 'test_session_id',
          type: 'document',
          metadata: { userId: 'test-user-123' },
          return_url: 'http://localhost:3000/test-return',
          options: {
            document: {
              require_id_number: true,
              require_matching_selfie: true,
            },
          },
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'test_session_id',
          type: 'document',
          status: 'verified',
        }),
      },
    },
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
  }));
});

// Mock database
const mockDb = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  rental: {
    update: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({
  db: mockDb,
}));

// Export mock database for use in tests
export { mockDb }; 