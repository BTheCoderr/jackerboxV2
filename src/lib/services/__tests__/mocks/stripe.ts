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
      status: 'succeeded',
    })),
    update: jest.fn().mockImplementation((id, data) => Promise.resolve({
      id,
      ...data,
    })),
  },
  refunds: {
    create: jest.fn().mockImplementation((data) => Promise.resolve({
      id: 'ref_123',
      payment_intent: data.payment_intent,
      status: 'succeeded',
    })),
  },
};

jest.mock('stripe', () => jest.fn(() => mockStripe)); 