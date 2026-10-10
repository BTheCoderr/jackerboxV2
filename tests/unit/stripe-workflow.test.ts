/** @jest-environment node */
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth/session';
import { POST as initiatePayment } from '@/app/api/payments/create-intent/route';
import { POST as stripeWebhook } from '@/app/api/webhooks/stripe/route';
import { POST as ownerPayout } from '@/app/api/payments/process-payout/route';
import { POST as depositRefund } from '@/app/api/payments/refund-security-deposit/route';
import { Prisma } from '../../prisma/generated/client';

jest.mock('@/lib/db', () => ({
  db: {
    rental: { findUnique: jest.fn(), findFirst: jest.fn(), updateMany: jest.fn() },
    payment: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock('@/lib/auth/session', () => ({ getCurrentUser: jest.fn() }));
jest.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
    refunds: { create: jest.fn() },
    transfers: { create: jest.fn() },
    webhooks: { constructEvent: jest.fn() },
  },
  formatAmountForStripe: (amount: number) => Math.round(amount * 100),
}));

const fn = (value: unknown) => value as jest.Mock;
const auth = fn(getCurrentUser);
const rentalGet = fn(db.rental.findUnique);
const rentalConflict = fn(db.rental.findFirst);
const rentalUpdate = fn(db.rental.updateMany);
const paymentGet = fn(db.payment.findUnique);
const paymentUpdate = fn(db.payment.update);
const paymentUpdateMany = fn(db.payment.updateMany);
const transaction = fn(db.$transaction);
const intentCreate = fn(stripe.paymentIntents.create);
const intentRetrieve = fn(stripe.paymentIntents.retrieve);
const refundCreate = fn(stripe.refunds.create);
const transferCreate = fn(stripe.transfers.create);
const verifyEvent = fn(stripe.webhooks.constructEvent);

const checkout = () => ({
  id: 'rent-1', renterId: 'renter-1', status: 'PENDING', createdAt: new Date(),
  totalPrice: 100, securityDeposit: 25, equipmentId: 'equipment-1',
  payment: { id: 'payment-1', status: 'PENDING', stripePaymentIntentId: null, metadata: {} },
  equipment: { title: 'Camera', owner: { stripeConnectAccountId: 'acct_test_owner' } },
});
const paid = () => ({
  ...checkout(), status: 'COMPLETED',
  payment: { ...checkout().payment, status: 'COMPLETED', stripePaymentIntentId: 'pi_test_paid', metadata: {} },
});
const post = (path: string, body: object, headers: Record<string, string> = {}) =>
  new Request('https://staging.example.test' + path, {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  });

const event = (type: string, object: object) => ({
  id: 'evt_test_one', created: Math.floor(Date.now() / 1000),
  type, data: { object },
});
const succeededIntent = () => ({
  id: 'pi_test_paid', amount: 12500, currency: 'usd',
  metadata: { rentalId: 'rent-1', paymentId: 'payment-1' },
});

describe('isolated Stripe checkout, webhook, payout and deposit scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_test_only';
    auth.mockResolvedValue({ id: 'renter-1', isAdmin: false });
    rentalGet.mockResolvedValue(checkout());
    rentalConflict.mockResolvedValue(null);
    rentalUpdate.mockResolvedValue({ count: 1 });
    paymentUpdate.mockResolvedValue({ id: 'payment-1' });
    paymentUpdateMany.mockResolvedValue({ count: 1 });
    paymentGet.mockResolvedValue({ id: 'payment-1', rentalId: 'rent-1', amount: 125, status: 'PENDING' });
    transaction.mockImplementation(async (callback: (tx: typeof db) => Promise<unknown>) => callback(db));
    intentCreate.mockResolvedValue({ id: 'pi_test_paid', client_secret: 'pi_secret_mock' });
    intentRetrieve.mockResolvedValue({ id: 'pi_test_paid', amount: 12500, currency: 'usd', status: 'requires_payment_method', client_secret: 'pi_secret_mock' });
    refundCreate.mockResolvedValue({ id: 're_test_mock' });
    transferCreate.mockResolvedValue({ id: 'tr_test_mock' });
    verifyEvent.mockReturnValue(event('payment_intent.succeeded', succeededIntent()));
  });
  afterAll(() => { delete process.env.STRIPE_WEBHOOK_SECRET; });

  test('checkout cannot initialize without authenticated renter', async () => {
    auth.mockResolvedValue(null);
    const response = await initiatePayment(post('/api/payments/create-intent', { rentalId: 'rent-1', paymentId: 'payment-1' }));
    expect(response.status).toBe(401);
    expect(intentCreate).not.toHaveBeenCalled();
  });

  test('checkout ignores client-supplied amount and uses rental and deposit values', async () => {
    const response = await initiatePayment(post('/api/payments/create-intent', { rentalId: 'rent-1', paymentId: 'payment-1', amount: 1, securityDeposit: 0 }));
    expect(response.status).toBe(200);
    expect(intentCreate).toHaveBeenCalledWith(expect.objectContaining({
      amount: 12500, currency: 'usd',
      metadata: expect.objectContaining({ rentalId: 'rent-1', paymentId: 'payment-1' }),
    }), { idempotencyKey: 'rental-rent-1-payment-payment-1-v1' });
  });

  test('existing matching PaymentIntent is reused without new charge', async () => {
    rentalGet.mockResolvedValue({ ...checkout(), payment: { ...checkout().payment, stripePaymentIntentId: 'pi_test_paid' } });
    const response = await initiatePayment(post('/api/payments/create-intent', { rentalId: 'rent-1', paymentId: 'payment-1' }));
    expect(response.status).toBe(200);
    expect(intentRetrieve).toHaveBeenCalledWith('pi_test_paid');
    expect(intentCreate).not.toHaveBeenCalled();
  });

  test('expired reservation cannot start a charge', async () => {
    rentalGet.mockResolvedValue({ ...checkout(), createdAt: new Date(Date.now() - 40 * 60 * 1000) });
    const response = await initiatePayment(post('/api/payments/create-intent', { rentalId: 'rent-1', paymentId: 'payment-1' }));
    expect(response.status).toBe(409);
    expect(intentCreate).not.toHaveBeenCalled();
  });

  test('unsigned Stripe event is rejected before DB access', async () => {
    const response = await stripeWebhook(post('/api/webhooks/stripe', { type: 'payment_intent.succeeded' }));
    expect(response.status).toBe(400);
    expect(verifyEvent).not.toHaveBeenCalled();
  });

  test('signature-verified success confirms payment and rental with serializable isolation', async () => {
    const response = await stripeWebhook(post('/api/webhooks/stripe', {}, { 'stripe-signature': 'mock-signature' }));
    expect(response.status).toBe(200);
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    expect(paymentUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'COMPLETED' }),
    }));
    expect(rentalUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'rent-1', status: 'PENDING' }, data: { status: 'PAID' },
    }));
  });

  test('duplicate successful Stripe event does not settle twice', async () => {
    paymentGet.mockResolvedValue({ id: 'payment-1', rentalId: 'rent-1', amount: 125, status: 'COMPLETED' });
    const response = await stripeWebhook(post('/api/webhooks/stripe', {}, { 'stripe-signature': 'mock-signature' }));
    expect(response.status).toBe(200);
    expect(transaction).not.toHaveBeenCalled();
  });

  test('mismatched Stripe rental metadata is rejected without settlement', async () => {
    verifyEvent.mockReturnValue(event('payment_intent.succeeded', {
      ...succeededIntent(), metadata: { rentalId: 'someone-else', paymentId: 'payment-1' },
    }));
    const response = await stripeWebhook(post('/api/webhooks/stripe', {}, { 'stripe-signature': 'mock-signature' }));
    expect(response.status).toBe(500);
    expect(paymentUpdate).not.toHaveBeenCalled();
  });

  test('conflicting paid booking is refunded with stable idempotency key', async () => {
    rentalConflict.mockResolvedValue({ id: 'conflicting-rent' });
    const response = await stripeWebhook(post('/api/webhooks/stripe', {}, { 'stripe-signature': 'mock-signature' }));
    expect(response.status).toBe(200);
    expect(refundCreate).toHaveBeenCalledWith({ payment_intent: 'pi_test_paid' }, {
      idempotencyKey: 'jackerbox-invalid-booking-pi_test_paid',
    });
    expect(paymentUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'REFUNDED' }) }));
    expect(transaction).not.toHaveBeenCalled();
  });

  test('payment failure changes pending state but never overwrites settled refund', async () => {
    verifyEvent.mockReturnValue(event('payment_intent.payment_failed', { id: 'pi_test_paid', last_payment_error: { message: 'declined' } }));
    paymentGet.mockResolvedValue({ id: 'payment-1', rentalId: 'rent-1', status: 'REFUNDED' });
    const response = await stripeWebhook(post('/api/webhooks/stripe', {}, { 'stripe-signature': 'mock-signature' }));
    expect(response.status).toBe(200);
    expect(transaction).not.toHaveBeenCalled();
  });

  test('unauthorized owner payout and refund are forbidden', async () => {
    expect((await ownerPayout(post('/api/payments/process-payout', { rentalId: 'rent-1' }))).status).toBe(403);
    expect((await depositRefund(post('/api/payments/refund-security-deposit', { rentalId: 'rent-1' }))).status).toBe(403);
    expect(transferCreate).not.toHaveBeenCalled();
    expect(refundCreate).not.toHaveBeenCalled();
  });

  test('owner payout excludes refundable deposit and takes ten percent platform fee', async () => {
    auth.mockResolvedValue({ id: 'admin-1', isAdmin: true });
    rentalGet.mockResolvedValue(paid());
    const response = await ownerPayout(post('/api/payments/process-payout', { rentalId: 'rent-1' }));
    expect(response.status).toBe(200);
    expect(transferCreate).toHaveBeenCalledWith(expect.objectContaining({
      amount: 9000, destination: 'acct_test_owner', currency: 'usd',
    }), { idempotencyKey: 'jackerbox-owner-transfer-rent-1-v1' });
  });

  test('previously paid legacy owner is never paid again', async () => {
    auth.mockResolvedValue({ id: 'admin-1', isAdmin: true });
    rentalGet.mockResolvedValue({ ...paid(), payment: { ...paid().payment, metadata: { legacyOwnerPayoutRecorded: true } } });
    const response = await ownerPayout(post('/api/payments/process-payout', { rentalId: 'rent-1' }));
    expect(response.status).toBe(409);
    expect(transferCreate).not.toHaveBeenCalled();
  });

  test('deposit refund is limited to deposit with stable idempotency key', async () => {
    auth.mockResolvedValue({ id: 'admin-1', isAdmin: true });
    rentalGet.mockResolvedValue(paid());
    const response = await depositRefund(post('/api/payments/refund-security-deposit', { rentalId: 'rent-1' }));
    expect(response.status).toBe(200);
    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_test_paid', amount: 2500,
    }, { idempotencyKey: 'jackerbox-security-deposit-rent-1-v1' });
  });

  test('already refunded legacy security deposit never gets second refund', async () => {
    auth.mockResolvedValue({ id: 'admin-1', isAdmin: true });
    rentalGet.mockResolvedValue({ ...paid(), payment: { ...paid().payment, metadata: { legacySecurityDepositRefundRecorded: true } } });
    const response = await depositRefund(post('/api/payments/refund-security-deposit', { rentalId: 'rent-1' }));
    expect(response.status).toBe(409);
    expect(refundCreate).not.toHaveBeenCalled();
  });
});
