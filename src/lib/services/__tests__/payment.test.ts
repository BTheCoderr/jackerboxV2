/// <reference types="jest" />

import { PaymentService } from '../payment';
import { mockStripe, mockDb } from './mocks';

// Define the enums since they're not exported directly from @prisma/client
const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  BLOCKED: 'BLOCKED',
  RETRY_SCHEDULED: 'RETRY_SCHEDULED'
} as const;

const RentalStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
} as const;

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent and database record', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'secret_123',
        amount: 1000,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      const mockMetadata = {
        userId: 'user_123',
        rentalId: 'rent_123',
        securityDeposit: '200',
        rentalAmount: '800',
      };

      const expectedPayment = {
        id: 'pay_123',
        stripePaymentIntentId: 'pi_123',
        amount: 10,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        userId: 'user_123',
        rentalId: 'rent_123',
        securityDepositAmount: 200,
        rentalAmount: 800,
        securityDepositReturned: false,
        ownerPaidOut: false,
        rental: { id: 'rent_123' }
      };

      // Setup mock responses
      mockStripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent);
      mockDb.payment.create.mockResolvedValueOnce(expectedPayment);

      const result = await PaymentService.createPaymentIntent(1000, 'usd', mockMetadata);

      expect(result).toEqual({
        paymentIntent: mockPaymentIntent,
        payment: expectedPayment,
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd',
        metadata: {
          userId: 'user_123',
          rentalId: 'rent_123',
          securityDeposit: '200',
          rentalAmount: '800',
        },
      });

      expect(mockDb.payment.create).toHaveBeenCalledWith({
        data: {
          stripePaymentIntentId: 'pi_123',
          amount: 10,
          currency: 'USD',
          status: PaymentStatus.PENDING,
          userId: 'user_123',
          rentalId: 'rent_123',
          rentalAmount: 800,
          securityDepositReturned: false,
          ownerPaidOut: false,
        },
        include: {
          rental: true,
        },
      });
    });
    
    it('should create a payment intent without a rental', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'secret_123',
        amount: 500,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      const mockMetadata = {
        userId: 'user_123',
        securityDeposit: '0',
        rentalAmount: '500',
      };

      const expectedPayment = {
        id: 'pay_123',
        stripePaymentIntentId: 'pi_123',
        amount: 5,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        userId: 'user_123',
        rentalId: expect.any(String), // Generated temp ID
        securityDepositAmount: 0,
        rentalAmount: 500,
        securityDepositReturned: false,
        ownerPaidOut: false,
        rental: null
      };

      mockStripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent);
      mockDb.payment.create.mockResolvedValueOnce(expectedPayment);

      const result = await PaymentService.createPaymentIntent(500, 'usd', mockMetadata);

      expect(result).toEqual({
        paymentIntent: mockPaymentIntent,
        payment: expectedPayment
      });

      expect(mockDb.payment.create.mock.calls[0][0].data.rentalId).toMatch(/^temp_\d+$/);
    });
  });

  describe('handlePaymentSuccess', () => {
    it('should update payment and rental status on success', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
      };

      const mockPayment = {
        id: 'pay_123',
        stripePaymentIntentId: 'pi_123',
        status: PaymentStatus.PENDING,
        rentalId: 'rent_123',
        rental: { id: 'rent_123' },
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValueOnce(mockPaymentIntent);
      mockDb.payment.findUnique.mockResolvedValueOnce(mockPayment);
      mockDb.payment.update.mockResolvedValueOnce(mockUpdatedPayment);
      mockDb.rental.update.mockResolvedValueOnce({ id: 'rent_123', status: RentalStatus.PAID });

      const result = await PaymentService.handlePaymentSuccess('pi_123');

      expect(result).toEqual({
        paymentIntent: mockPaymentIntent,
        payment: mockUpdatedPayment,
      });
    });
    
    it('should throw error if payment not found', async () => {
      mockDb.payment.findUnique.mockResolvedValueOnce(null);

      await expect(PaymentService.handlePaymentSuccess('pi_123')).rejects.toThrow('Payment not found');
    });
  });

  describe('handlePaymentFailure', () => {
    it('should update payment and rental status on failure', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'requires_payment_method',
      };

      const mockPayment = {
        id: 'pay_123',
        rentalId: 'rent_123',
        rental: {
          id: 'rent_123',
        },
      };
      
      const mockUpdatedPayment = {
        id: 'pay_123',
        status: PaymentStatus.FAILED,
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValueOnce(mockPaymentIntent);
      mockDb.payment.findUnique.mockResolvedValueOnce(mockPayment);
      mockDb.payment.update.mockResolvedValueOnce(mockUpdatedPayment);

      const result = await PaymentService.handlePaymentFailure('pi_123');

      expect(result).toEqual({
        paymentIntent: mockPaymentIntent,
        payment: mockUpdatedPayment
      });
      
      expect(mockDb.payment.findUnique).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_123' },
        include: { rental: true }
      });

      expect(mockDb.payment.update).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_123' },
        data: {
          status: PaymentStatus.FAILED,
        }
      });

      expect(mockDb.rental.update).toHaveBeenCalledWith({
        where: { id: 'rent_123' },
        data: { status: RentalStatus.PAYMENT_FAILED },
      });
    });
  });

  describe('refundPayment', () => {
    it('should process refund and update statuses', async () => {
      const mockRefund = {
        id: 'ref_123',
        status: 'succeeded',
      };

      const mockPayment = {
        id: 'pay_123',
        rentalId: 'rent_123',
        rental: {
          id: 'rent_123',
        },
      };
      
      const mockUpdatedPayment = {
        id: 'pay_123',
        status: PaymentStatus.REFUNDED,
        securityDepositReturned: true
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValueOnce({ id: 'pi_123' });
      mockStripe.refunds.create.mockResolvedValueOnce(mockRefund);
      mockDb.payment.findUnique.mockResolvedValueOnce(mockPayment);
      mockDb.payment.update.mockResolvedValueOnce(mockUpdatedPayment);

      const result = await PaymentService.refundPayment('pi_123');

      expect(result).toEqual({
        refund: mockRefund,
        payment: mockUpdatedPayment
      });

      expect(mockDb.payment.update).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_123' },
        data: {
          status: PaymentStatus.REFUNDED,
          securityDepositReturned: true
        }
      });

      expect(mockDb.rental.update).toHaveBeenCalledWith({
        where: { id: 'rent_123' },
        data: { status: RentalStatus.REFUNDED },
      });
    });
  });
  
  describe('blockPayment', () => {
    it('should block payment and update rental status', async () => {
      const mockPayment = {
        id: 'pay_123',
        rentalId: 'rent_123',
        rental: {
          id: 'rent_123',
        },
      };
      
      const mockUpdatedPayment = {
        id: 'pay_123',
        status: PaymentStatus.BLOCKED
      };

      mockDb.payment.findUnique.mockResolvedValueOnce(mockPayment);
      mockDb.payment.update.mockResolvedValueOnce(mockUpdatedPayment);

      const result = await PaymentService.blockPayment('pi_123');

      expect(result).toEqual(mockUpdatedPayment);

      expect(mockDb.payment.update).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_123' },
        data: {
          status: PaymentStatus.BLOCKED,
        }
      });

      expect(mockDb.rental.update).toHaveBeenCalledWith({
        where: { id: 'rent_123' },
        data: { status: RentalStatus.PAYMENT_FAILED },
      });
    });
  });
  
  describe('scheduleRetry', () => {
    it('should update payment status to retry scheduled', async () => {
      const mockUpdatedPayment = {
        id: 'pay_123',
        status: PaymentStatus.RETRY_SCHEDULED,
      };

      mockDb.payment.update.mockResolvedValueOnce(mockUpdatedPayment);

      const result = await PaymentService.scheduleRetry('pi_123');

      expect(result).toEqual(mockUpdatedPayment);
      expect(mockDb.payment.update).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_123' },
        data: { status: PaymentStatus.RETRY_SCHEDULED },
      });
    });
  });
  
  describe('updatePaymentIntent', () => {
    it('should update a payment intent', async () => {
      const mockUpdatedPaymentIntent = {
        id: 'pi_123',
        metadata: { key: 'updated_value' },
      };

      mockStripe.paymentIntents.update.mockResolvedValueOnce(mockUpdatedPaymentIntent);

      const updateData = { metadata: { key: 'updated_value' } };
      const result = await PaymentService.updatePaymentIntent('pi_123', updateData);

      expect(result).toEqual(mockUpdatedPaymentIntent);
      expect(mockStripe.paymentIntents.update).toHaveBeenCalledWith('pi_123', updateData);
    });
    
    it('should retry on failure', async () => {
      const mockError = new Error('Network failure');
      const mockSuccess = { id: 'pi_123', metadata: { key: 'updated_value' } };

      mockStripe.paymentIntents.update
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockSuccess);

      const updateData = { metadata: { key: 'updated_value' } };
      const result = await PaymentService.updatePaymentIntent('pi_123', updateData);

      expect(result).toEqual(mockSuccess);
      expect(mockStripe.paymentIntents.update).toHaveBeenCalledTimes(3);
    });
    
    it('should throw error after max retries', async () => {
      const mockError = new Error('Network failure');

      mockStripe.paymentIntents.update.mockRejectedValue(mockError);

      const updateData = { metadata: { key: 'updated_value' } };
      await expect(PaymentService.updatePaymentIntent('pi_123', updateData)).rejects.toThrow('Network failure');

      expect(mockStripe.paymentIntents.update).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });
  });
}); 