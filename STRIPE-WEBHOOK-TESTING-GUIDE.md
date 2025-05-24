# Stripe Webhook Testing Guide

## 🎯 Overview

This guide provides multiple methods to test your Stripe webhooks and verify that your payment processing is working correctly.

## 🔧 Current Setup

**Webhook Endpoint:** `https://jackerbox-ej0ntneyf-be-forreals-projects.vercel.app/api/webhooks/stripe`
**Webhook Secret:** `whsec_kTJDU6ECxltUmKgdxyl0zaa1HtRmBzwE`
**API Version:** `2025-01-27.acacia`

### Events Currently Handled:
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `charge.refunded`
- ✅ `identity.verification_session.verified`
- ✅ `identity.verification_session.requires_input`

## 🚀 Testing Methods

### Method 1: Web Interface Testing

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Visit the test page:**
   ```
   http://localhost:3001/test-stripe
   ```

3. **Use the interactive test buttons:**
   - Create Test Payment Intent
   - Test Payment Success Webhook
   - Test Payment Failed Webhook
   - Test Identity Verification Webhook

### Method 2: Command Line Testing

#### Full Test Suite
```bash
npm run test-stripe-webhooks
```

#### Individual Tests
```bash
# Test successful payment
npm run test-stripe-success

# Test failed payment
npm run test-stripe-failed

# Create a test payment intent
npm run create-test-payment
```

#### Advanced CLI Usage
```bash
# Create payment intent only
npx ts-node scripts/test-stripe-webhooks.ts create-payment

# Create identity verification session
npx ts-node scripts/test-stripe-webhooks.ts create-identity

# Test specific webhook event
npx ts-node scripts/test-stripe-webhooks.ts test-success
```

### Method 3: Stripe CLI (Recommended for Real-time Testing)

#### Setup Stripe CLI
```bash
# Install (macOS)
brew install stripe/stripe-cli/stripe

# Install (other platforms)
# Download from: https://github.com/stripe/stripe-cli/releases
```

#### Login and Setup
```bash
# Login to your Stripe account
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

#### Trigger Test Events
```bash
# Test payment success
stripe trigger payment_intent.succeeded

# Test payment failure
stripe trigger payment_intent.payment_failed

# Test charge refund
stripe trigger charge.refunded

# Test identity verification
stripe trigger identity.verification_session.verified
```

### Method 4: Direct API Testing with cURL

#### Test Payment Success Webhook
```bash
curl -X POST http://localhost:3001/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"eventType": "payment_intent.succeeded"}'
```

#### Test Payment Failure Webhook
```bash
curl -X POST http://localhost:3001/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"eventType": "payment_intent.payment_failed"}'
```

#### Create Test Payment
```bash
curl -X POST http://localhost:3001/api/create-test-payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 2000, "currency": "usd"}'
```

## 🧪 Testing Scenarios

### 1. Payment Success Flow
```bash
# Create payment intent
npm run create-test-payment

# Simulate successful payment
npm run test-stripe-success
```

### 2. Payment Failure Flow
```bash
# Simulate failed payment
npm run test-stripe-failed
```

### 3. Identity Verification Flow
```bash
# Test identity verification webhook
npx ts-node scripts/test-stripe-webhooks.ts create-identity
```

## 🔍 Verification Steps

### Check Database Updates
After running webhook tests, verify that your database was updated correctly:

1. **Payment Success:** Check that payment status changed to `COMPLETED`
2. **Payment Failure:** Check that payment status changed to `FAILED`
3. **Identity Verification:** Check that user's `idVerified` status updated

### Check Logs
Monitor your application logs for webhook processing:

```bash
# In development
npm run dev

# Look for webhook log messages in the console
```

### Check Stripe Dashboard
1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to "Webhooks" section
3. Check the webhook endpoint status and recent deliveries

## 🛠 Environment Setup

### Required Environment Variables
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_kTJDU6ECxltUmKgdxyl0zaa1HtRmBzwE
```

### Database Connection
Ensure your database is properly connected and the `Payment` and `User` tables exist with the correct schema.

## 🐛 Troubleshooting

### Common Issues

1. **Webhook Secret Mismatch**
   - Ensure `STRIPE_WEBHOOK_SECRET` matches your Stripe dashboard
   - Copy the exact secret from Stripe (including `whsec_` prefix)

2. **Database Connection Issues**
   - Check your database connection string
   - Verify Prisma schema is up to date: `npx prisma generate`

3. **Payment Not Found**
   - Ensure you're creating the payment record in your database before testing webhooks
   - Check that the `stripePaymentIntentId` matches

4. **CORS Issues (Local Testing)**
   - Make sure your local server is running on the correct port (3001)
   - Check that the webhook endpoint URL is correct

### Debug Mode
To enable more detailed logging, set:
```bash
NODE_ENV=development
```

## 📊 Test Results Analysis

### Expected Successful Test Output
```
🚀 Starting Stripe Webhook Tests
📍 Testing endpoint: http://localhost:3001/api/webhooks/stripe
🔑 Using webhook secret: whsec_kTJD...

🔄 Creating test payment intent...
✅ Payment Intent created: pi_test_123...
   Status: requires_payment_method
   Amount: 20 USD

🧪 Testing webhook with payment_intent.succeeded event...
✅ Webhook processed successfully
   Status: 200
   Response: { received: true }

🎉 All tests completed!
```

### What to Check After Tests
1. ✅ All webhook tests return 200 status
2. ✅ Database records are created/updated correctly
3. ✅ No error messages in application logs
4. ✅ Stripe dashboard shows successful webhook deliveries

## 🚀 Next Steps

1. **Test in Production:** Update webhook endpoint to production URL
2. **Monitor Real Transactions:** Watch for actual payment webhook events
3. **Add More Event Types:** Consider handling additional Stripe events
4. **Error Handling:** Implement retry logic for failed webhook processing

## 📝 Test Card Numbers

For testing payments, use these Stripe test card numbers:

- **Success:** `4242424242424242`
- **Decline:** `4000000000000002`
- **Insufficient Funds:** `4000000000009995`
- **Expired Card:** `4000000000000069`

## 🔗 Useful Links

- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe Event Types](https://stripe.com/docs/api/events/types) 