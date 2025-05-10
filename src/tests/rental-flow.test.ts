import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { db } from '@/lib/db';
import { PaymentService } from '@/lib/services/payment';
import { PaymentStatus, RentalStatus, UserRole } from '@prisma/client';

// Mock data
const TEST_USER_RENTER = {
  id: 'test-renter-123',
  email: 'renter@test.com',
  name: 'Test Renter',
  role: UserRole.USER
};

const TEST_USER_OWNER = {
  id: 'test-owner-123',
  email: 'owner@test.com',
  name: 'Test Owner',
  role: UserRole.USER
};

const TEST_EQUIPMENT = {
  id: 'test-equipment-123',
  name: 'Test Camera',
  description: 'Professional DSLR camera',
  dailyRate: 100,
  ownerId: TEST_USER_OWNER.id
};

describe('Complete Rental Flow', () => {
  beforeAll(async () => {
    // Create test users and equipment
    await db.user.create({ data: TEST_USER_RENTER });
    await db.user.create({ data: TEST_USER_OWNER });
    await db.equipment.create({ data: TEST_EQUIPMENT });
  });

  afterAll(async () => {
    // Cleanup test data
    await db.rental.deleteMany({ where: { equipmentId: TEST_EQUIPMENT.id } });
    await db.equipment.delete({ where: { id: TEST_EQUIPMENT.id } });
    await db.user.deleteMany({
      where: {
        id: { in: [TEST_USER_RENTER.id, TEST_USER_OWNER.id] }
      }
    });
  });

  it('should complete a successful rental flow', async () => {
    // Step 1: Create rental booking
    const rental = await db.rental.create({
      data: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day rental
        status: RentalStatus.PENDING,
        equipmentId: TEST_EQUIPMENT.id,
        renterId: TEST_USER_RENTER.id,
        totalAmount: TEST_EQUIPMENT.dailyRate
      }
    });

    expect(rental).toBeDefined();
    expect(rental.status).toBe(RentalStatus.PENDING);

    // Step 2: Process payment
    const { paymentIntent, payment } = await PaymentService.createPaymentIntent(
      TEST_EQUIPMENT.dailyRate * 100, // Convert to cents
      'usd',
      {
        userId: TEST_USER_RENTER.id,
        rentalId: rental.id,
        rentalAmount: String(TEST_EQUIPMENT.dailyRate)
      }
    );

    expect(payment).toBeDefined();
    expect(payment.status).toBe(PaymentStatus.PENDING);

    // Simulate successful payment
    const { payment: updatedPayment } = await PaymentService.handlePaymentSuccess(
      paymentIntent.id
    );

    expect(updatedPayment.status).toBe(PaymentStatus.COMPLETED);

    // Step 3: Create message thread
    const thread = await db.messageThread.create({
      data: {
        rentalId: rental.id,
        participants: {
          connect: [
            { id: TEST_USER_RENTER.id },
            { id: TEST_USER_OWNER.id }
          ]
        }
      }
    });

    expect(thread).toBeDefined();

    // Step 4: Send messages
    const message = await db.message.create({
      data: {
        content: 'Hello, I have some questions about the equipment',
        threadId: thread.id,
        senderId: TEST_USER_RENTER.id
      }
    });

    expect(message).toBeDefined();
    expect(message.content).toBe('Hello, I have some questions about the equipment');

    // Step 5: Complete rental and submit review
    const completedRental = await db.rental.update({
      where: { id: rental.id },
      data: { status: RentalStatus.COMPLETED }
    });

    expect(completedRental.status).toBe(RentalStatus.COMPLETED);

    const review = await db.review.create({
      data: {
        rating: 5,
        comment: 'Great equipment, very professional owner',
        rentalId: rental.id,
        reviewerId: TEST_USER_RENTER.id,
        revieweeId: TEST_USER_OWNER.id
      }
    });

    expect(review).toBeDefined();
    expect(review.rating).toBe(5);
  });

  it('should handle payment failure correctly', async () => {
    // Create rental
    const rental = await db.rental.create({
      data: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: RentalStatus.PENDING,
        equipmentId: TEST_EQUIPMENT.id,
        renterId: TEST_USER_RENTER.id,
        totalAmount: TEST_EQUIPMENT.dailyRate
      }
    });

    // Create payment intent
    const { paymentIntent } = await PaymentService.createPaymentIntent(
      TEST_EQUIPMENT.dailyRate * 100,
      'usd',
      {
        userId: TEST_USER_RENTER.id,
        rentalId: rental.id,
        rentalAmount: String(TEST_EQUIPMENT.dailyRate)
      }
    );

    // Simulate payment failure
    const { payment: failedPayment } = await PaymentService.handlePaymentFailure(
      paymentIntent.id
    );

    expect(failedPayment.status).toBe(PaymentStatus.FAILED);

    // Verify rental status is updated
    const updatedRental = await db.rental.findUnique({
      where: { id: rental.id }
    });

    expect(updatedRental?.status).toBe(RentalStatus.PAYMENT_FAILED);
  });
}); 