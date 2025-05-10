import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
  
  // Setup default mock implementations
  prismaMock.payment.update.mockImplementation((data) => {
    return Promise.resolve({
      id: 'pay_123',
      ...data.data,
    });
  });

  prismaMock.payment.findUnique.mockImplementation((data) => {
    return Promise.resolve({
      id: 'pay_123',
      stripepaymentintentid: data.where.stripepaymentintentid,
      status: data.where.status || 'PENDING',
      rentalid: 'rent_123',
      Rental: { id: 'rent_123' },
    });
  });

  prismaMock.rental.update.mockImplementation((data) => {
    return Promise.resolve({
      id: data.where.id,
      status: data.data.status,
    });
  });
});

export type Context = {
  prisma: PrismaClient;
};

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
}; 