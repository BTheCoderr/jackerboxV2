import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PaymentStatus, RentalStatus, ModerationStatus } from '@prisma/client';
import { prismaMock } from './mocks/prisma';
import { mockStripe } from './mocks/stripe';

jest.mock('@/lib/db', () => ({
  db: prismaMock
}));

jest.mock('stripe', () => jest.fn(() => mockStripe));

// Now import the payment service after setting up mocks
import { PaymentService } from '@/lib/services/payment';

// Mock data
const TEST_USER_RENTER = {
  id: 'test-renter-123',
  email: 'renter@test.com',
  name: 'Test Renter',
  role: 'USER',
  emailverified: null,
  image: null,
  password: null,
  phone: null,
  phoneverified: false,
  bio: null,
  createdat: new Date(),
  updatedat: new Date(),
  verificationtoken: null,
  twofactorenabled: false,
  idverified: false,
  idverificationstatus: 'PENDING',
  iddocumenttype: null,
  iddocumenturl: null,
  idverificationdate: null,
  isadmin: false,
  stripeconnectaccountid: null,
  usertype: 'both'
};

const TEST_USER_OWNER = {
  ...TEST_USER_RENTER,
  id: 'test-owner-123',
  email: 'owner@test.com',
  name: 'Test Owner'
};

const TEST_EQUIPMENT = {
  id: 'test-equipment-123',
  title: 'Test Camera',
  description: 'Professional DSLR camera',
  condition: 'Excellent',
  category: 'Photography',
  subcategory: null,
  tagsjson: '[]',
  location: 'New York, NY',
  latitude: null,
  longitude: null,
  hourlyrate: null,
  dailyrate: 100,
  weeklyrate: null,
  securitydeposit: null,
  imagesjson: '[]',
  isverified: false,
  isavailable: true,
  createdat: new Date(),
  updatedat: new Date(),
  moderationstatus: ModerationStatus.PENDING,
  moderatedat: null,
  moderatedby: null,
  moderationnotes: null,
  ownerid: TEST_USER_OWNER.id
};

describe('Complete Rental Flow', () => {
  beforeEach(() => {
    // Setup mock responses
    prismaMock.user.create.mockResolvedValue(TEST_USER_RENTER);
    prismaMock.equipment.create.mockResolvedValue(TEST_EQUIPMENT);
    
    const mockRental = {
      id: 'rent_123',
      startdate: new Date(),
      enddate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: RentalStatus.PENDING,
      equipmentid: TEST_EQUIPMENT.id,
      renterid: TEST_USER_RENTER.id,
      totalamount: TEST_EQUIPMENT.dailyrate,
      createdat: new Date(),
      updatedat: new Date()
    };

    let currentRentalStatus = RentalStatus.PENDING;

    prismaMock.rental.create.mockResolvedValue(mockRental);
    prismaMock.rental.update.mockImplementation((data) => {
      currentRentalStatus = data.data.status as RentalStatus;
      return Promise.resolve({
        ...mockRental,
        status: currentRentalStatus
      });
    });
    prismaMock.rental.findUnique.mockImplementation((data) => {
      return Promise.resolve({
        ...mockRental,
        status: currentRentalStatus
      });
    });

    const mockMessage = {
      id: 'msg_123',
      content: 'Hello, I have some questions about the equipment',
      senderid: TEST_USER_RENTER.id,
      receiverid: TEST_USER_OWNER.id,
      createdat: new Date(),
      readat: null
    };
    prismaMock.message.create.mockResolvedValue(mockMessage);

    const mockReview = {
      id: 'rev_123',
      rating: 5,
      comment: 'Great equipment, very professional owner',
      rentalid: mockRental.id,
      authorid: TEST_USER_RENTER.id,
      receiverid: TEST_USER_OWNER.id,
      createdat: new Date(),
      updatedat: new Date(),
      equipmentid: TEST_EQUIPMENT.id
    };
    prismaMock.review.create.mockResolvedValue(mockReview);

    const mockPayment = {
      id: 'pay_123',
      stripepaymentintentid: 'pi_123',
      amount: TEST_EQUIPMENT.dailyrate,
      currency: 'USD',
      status: PaymentStatus.PENDING,
      userid: TEST_USER_RENTER.id,
      rentalid: mockRental.id,
      createdat: new Date(),
      updatedat: new Date(),
      paidat: null,
      failedat: null,
      refundedat: null,
      metadata: null,
      retrycount: 0,
      lastretryat: null,
      nextretryat: null,
      ipaddress: null,
      useragent: null,
      fraudscore: 0,
      velocityscore: 0,
      isblocked: false,
      blockreason: null,
      stripechargeid: null,
      Rental: mockRental
    };
    prismaMock.payment.create.mockResolvedValue(mockPayment);
    prismaMock.payment.update.mockImplementation((data) => {
      return Promise.resolve({
        ...mockPayment,
        ...data.data
      });
    });
    prismaMock.payment.findUnique.mockImplementation((data) => {
      return Promise.resolve({
        ...mockPayment,
        stripepaymentintentid: data.where.stripepaymentintentid,
        status: data.where.status || PaymentStatus.PENDING
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should complete a successful rental flow', async () => {
    // Step 1: Create rental booking
    const rental = await prismaMock.rental.create({
      data: {
        startdate: new Date(),
        enddate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: RentalStatus.PENDING,
        equipmentid: TEST_EQUIPMENT.id,
        renterid: TEST_USER_RENTER.id,
        totalamount: TEST_EQUIPMENT.dailyrate
      }
    });

    expect(rental).toBeDefined();
    expect(rental.status).toBe(RentalStatus.PENDING);

    // Step 2: Process payment
    const { paymentIntent, payment } = await PaymentService.createPaymentIntent(
      TEST_EQUIPMENT.dailyrate * 100,
      'usd',
      {
        userId: TEST_USER_RENTER.id,
        rentalId: rental.id,
        rentalAmount: String(TEST_EQUIPMENT.dailyrate)
      }
    );

    expect(payment).toBeDefined();
    expect(payment.status).toBe(PaymentStatus.PENDING);

    // Simulate successful payment
    const { payment: updatedPayment } = await PaymentService.handlePaymentSuccess(
      paymentIntent.id
    );

    expect(updatedPayment.status).toBe(PaymentStatus.COMPLETED);

    // Step 3: Create message
    const message = await prismaMock.message.create({
      data: {
        content: 'Hello, I have some questions about the equipment',
        senderid: TEST_USER_RENTER.id,
        receiverid: TEST_USER_OWNER.id
      }
    });

    expect(message).toBeDefined();
    expect(message.content).toBe('Hello, I have some questions about the equipment');

    // Step 4: Complete rental and submit review
    const completedRental = await prismaMock.rental.update({
      where: { id: rental.id },
      data: { status: RentalStatus.COMPLETED }
    });

    expect(completedRental.status).toBe(RentalStatus.COMPLETED);

    const review = await prismaMock.review.create({
      data: {
        rating: 5,
        comment: 'Great equipment, very professional owner',
        rentalid: rental.id,
        authorid: TEST_USER_RENTER.id,
        receiverid: TEST_USER_OWNER.id,
        equipmentid: TEST_EQUIPMENT.id
      }
    });

    expect(review).toBeDefined();
    expect(review.rating).toBe(5);
  });

  it('should handle payment failure correctly', async () => {
    // Create rental
    const rental = await prismaMock.rental.create({
      data: {
        startdate: new Date(),
        enddate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: RentalStatus.PENDING,
        equipmentid: TEST_EQUIPMENT.id,
        renterid: TEST_USER_RENTER.id,
        totalamount: TEST_EQUIPMENT.dailyrate
      }
    });

    // Create payment intent
    const { paymentIntent } = await PaymentService.createPaymentIntent(
      TEST_EQUIPMENT.dailyrate * 100,
      'usd',
      {
        userId: TEST_USER_RENTER.id,
        rentalId: rental.id,
        rentalAmount: String(TEST_EQUIPMENT.dailyrate)
      }
    );

    // Mock failed payment
    mockStripe.paymentIntents.retrieve.mockResolvedValueOnce({
      id: paymentIntent.id,
      status: 'requires_payment_method',
      last_payment_error: {
        code: 'card_declined',
        message: 'Your card was declined.'
      }
    });

    // Simulate payment failure
    const { payment: failedPayment } = await PaymentService.handlePaymentFailure(
      paymentIntent.id
    );

    expect(failedPayment.status).toBe(PaymentStatus.FAILED);

    // Verify rental status is updated
    const updatedRental = await prismaMock.rental.findUnique({
      where: { id: rental.id }
    });

    expect(updatedRental?.status).toBe(RentalStatus.PAYMENT_FAILED);
  });
}); 