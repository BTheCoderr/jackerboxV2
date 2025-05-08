import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.test
config({ path: path.resolve(__dirname, '../../.env.test') });

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
  }));
});

// Mock database
jest.mock('@/lib/db', () => {
  return {
    db: {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  };
}); 