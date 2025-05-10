// Mock Stripe
export const mockStripe = {
  paymentIntents: {
    create: jest.fn().mockImplementation((data) => Promise.resolve({
      id: 'pi_123',
      client_secret: 'secret_123',
      amount: data.amount,
      currency: data.currency,
      status: 'requires_payment_method',
      metadata: data.metadata,
    })),
    retrieve: jest.fn().mockImplementation((id) => Promise.resolve({
      id,
      status: 'requires_payment_method',
    })),
    update: jest.fn().mockImplementation((id, data) => Promise.resolve({
      id,
      ...data,
      status: 'requires_payment_method',
    })),
  },
  refunds: {
    create: jest.fn().mockImplementation((data) => Promise.resolve({
      id: 'ref_123',
      payment_intent: data.payment_intent,
      status: 'succeeded',
    })),
  },
  identity: {
    verificationSessions: {
      create: jest.fn().mockImplementation((data) => Promise.resolve({
        id: 'vs_123',
        type: 'document',
        metadata: data.metadata,
        return_url: data.return_url,
        options: data.options,
      })),
      retrieve: jest.fn().mockImplementation((id) => Promise.resolve({
        id,
        type: 'document',
        status: 'verified',
      })),
    },
  },
};

// Mock the database
export const mockDb = {
  payment: {
    create: jest.fn().mockImplementation((data) => Promise.resolve({
      id: 'pay_123',
      ...data.data,
      rental: { id: data.data.rentalId },
    })),
    update: jest.fn().mockImplementation((data) => {
      // Store the updated payment data
      const updatedPayment = {
        id: 'pay_123',
        ...data.data,
      };
      // Update the findUnique mock to return the latest status
      mockDb.payment.findUnique = jest.fn().mockImplementation(() => Promise.resolve(updatedPayment));
      return Promise.resolve(updatedPayment);
    }),
    findUnique: jest.fn().mockImplementation((data) => Promise.resolve({
      id: 'pay_123',
      stripePaymentIntentId: data.where.stripePaymentIntentId,
      status: 'FAILED',
      rentalId: 'rent_123',
      rental: { id: 'rent_123' },
    })),
  },
  rental: {
    update: jest.fn().mockImplementation((data) => Promise.resolve({
      id: data.where.id,
      status: data.data.status,
    })),
    findUnique: jest.fn().mockImplementation((data) => Promise.resolve({
      id: data.where.id,
      status: 'PAYMENT_FAILED',
    })),
  },
  user: {
    create: jest.fn().mockImplementation((data) => Promise.resolve({
      id: 'user_123',
      ...data.data,
    })),
    update: jest.fn().mockImplementation((data) => Promise.resolve({
      id: data.where.id,
      ...data.data,
    })),
    findUnique: jest.fn().mockImplementation((data) => Promise.resolve({
      id: data.where.id,
      email: 'test@example.com',
      name: 'Test User',
    })),
    delete: jest.fn().mockImplementation((data) => Promise.resolve({
      id: data.where.id,
    })),
  },
};

// Setup mocks
jest.mock('stripe', () => jest.fn(() => mockStripe));
jest.mock('@/lib/db', () => ({ db: mockDb })); 