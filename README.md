# Jackerbox - Equipment Rental Platform

Jackerbox is a modern platform for renting equipment, with features for secure payments, owner payouts, and security deposits.

## Features

- User authentication and profiles
- Equipment listing and browsing
- Rental booking and management
- Secure payment processing with Stripe
- Security deposit handling
- Owner payouts
- Admin dashboard
- Notification system
- ID verification with Stripe Identity
- Phone number verification with Firebase Authentication

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS, Shadcn UI components
- **Deployment**: Vercel
- **Identity Verification**: Stripe Identity
- **Phone Verification**: Firebase Authentication

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Stripe account for payment processing
- A Firebase project for phone verification

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/jackerbox.git
   cd jackerbox
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required environment variables

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Stripe Integration

Jackerbox uses Stripe for payment processing. To set up Stripe:

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Add the following to your `.env` file:
   ```
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
   STRIPE_ACCOUNT_COUNTRY=US
   ```

4. Set up Stripe Connect for owner payouts:
   - Enable Connect in your Stripe Dashboard
   - Configure the Connect settings for your platform
   - Update the Stripe Connect integration in the application

5. Set up Stripe webhooks:
   - Create a webhook endpoint in the Stripe Dashboard
   - Point it to `https://your-domain.com/api/webhooks/stripe`
   - Select the events you want to listen for (payment_intent.succeeded, etc.)
   - Get the webhook signing secret and add it to your `.env` file

## Stripe Identity Verification

Jackerbox uses Stripe Identity for ID verification. To set up Stripe Identity:

1. Enable Stripe Identity in your Stripe Dashboard
2. Configure the Identity settings for your platform
3. Set up Stripe Identity webhooks:
   - Create a webhook endpoint in the Stripe Dashboard
   - Point it to `https://your-domain.com/api/webhooks/stripe-identity`
   - Select the Identity events you want to listen for (identity.verification_session.verified, etc.)
   - Get the webhook signing secret and add it to your `.env` file as `STRIPE_IDENTITY_WEBHOOK_SECRET`

## Firebase Phone Verification

Jackerbox uses Firebase Authentication for phone number verification. To set up Firebase:

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Phone Authentication in the Firebase Console
3. Add your app to the Firebase project and get the configuration
4. Add the following to your `.env` file:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
5. Configure the allowed domains for reCAPTCHA verification in the Firebase Console

## Admin Setup

To create an admin user:

```bash
npm run create-admin your-email@example.com
```

## Development

### Database Schema

The database schema is defined in `prisma/schema.prisma`. To update the schema:

1. Edit the schema file
2. Run migrations:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

### API Routes

- `/api/payments/create-intent` - Create a payment intent
- `/api/payments/process-payout` - Process owner payout
- `/api/webhooks/stripe` - Stripe webhook handler
- `/api/webhooks/stripe-identity` - Stripe Identity webhook handler
- `/api/stripe/identity-verification` - Create a Stripe Identity verification session
- `/api/users/update-phone` - Update user's phone number
- `/api/users/verify-phone` - Verify user's phone number
- `/api/notifications` - Get user notifications

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## AWS S3 and CloudFront Setup

### S3 Bucket Setup

Jackerbox uses AWS S3 for storing and serving files. To set up your S3 bucket:

1. Create an AWS account if you don't have one
2. Create an IAM user with programmatic access and S3 permissions
3. Get your AWS access key and secret key
4. Add them to your `.env` file:
   ```
   AWS_REGION=us-east-2
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_S3_BUCKET_NAME=your-bucket-name
   ```
5. Run the setup script to create and configure your S3 bucket:
   ```bash
   npm run create-s3-bucket
   ```

This script will:
- Create a new S3 bucket with the name specified in your `.env` file
- Configure CORS settings to allow cross-origin requests
- Set up a bucket policy to allow public read access
- Configure public access settings

### CloudFront CDN Setup

For faster content delivery, you can set up a CloudFront distribution for your S3 bucket:

1. Run the CloudFront setup script:
   ```bash
   npm run setup-cloudfront
   ```

2. Add the CloudFront domain to your `.env` file:
   ```
   CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net
   CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
   ```

3. The application will automatically use CloudFront for serving files when available.

### Secure File Uploads

Jackerbox uses pre-signed URLs for secure client-side uploads to S3. This approach:
- Prevents unauthorized uploads
- Allows for direct uploads from the browser to S3
- Supports progress tracking
- Reduces server load

To use the file upload component:

```jsx
import { FileUpload } from '@/components/ui/file-upload';

function MyComponent() {
  const handleUploadComplete = (files) => {
    console.log('Uploaded files:', files);
  };

  return (
    <FileUpload
      onUploadComplete={handleUploadComplete}
      folder="profile-images"
      multiple={false}
    />
  );
}
```

### S3 Service API

The S3 service provides the following functions:

- `uploadToS3(file, contentType, folder?, filename?)` - Upload a file to S3
- `getSignedUploadUrl(key, contentType, expiresIn?)` - Generate a pre-signed URL for uploading
- `getSignedDownloadUrl(key, expiresIn?)` - Generate a pre-signed URL for downloading
- `getPublicS3Url(key)` - Get the public URL for an object (uses CloudFront if available)
- `objectExists(key)` - Check if an object exists
- `listObjects(prefix?, maxKeys?)` - List objects in a folder
- `copyObject(sourceKey, destinationKey)` - Copy an object within S3
- `deleteFromS3(key)` - Delete an object from S3
- `invalidateCloudFrontCache(paths)` - Invalidate CloudFront cache for specific paths

## Payment System

### Overview

The application includes a complete payment system built on Stripe. Key features include:

- Processing payments with Stripe PaymentIntent
- Handling success, failure, and refund scenarios
- Security deposit management
- Webhook processing for real-time payment updates

### Payment Service

The `PaymentService` class (`src/lib/services/payment.ts`) provides the core functionality:

- `createPaymentIntent` - Creates a new payment intent with Stripe
- `handlePaymentSuccess` - Updates payment and rental records when payment succeeds
- `handlePaymentFailure` - Handles failed payments
- `refundPayment` - Processes refunds
- `blockPayment` - Blocks problematic payments
- `scheduleRetry` - Schedules payment retries

### Webhook Handling

The system includes a robust webhook handling system:

- Production endpoint: `/api/webhooks/stripe`
- Development testing endpoint: `/api/webhooks/stripe/dev`
- Shared webhook handler logic in `src/lib/webhooks/stripe-webhook-handler.ts`

### Testing

To test the payment system:

1. Visit `/admin/payment-test` (admin only) to create and process test payments
2. Use the Stripe CLI to send test webhook events to the dev endpoint
3. Run the test suite with `npm test` to verify payment functionality

### Stripe Configuration

Required environment variables:

```
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

For production, use live keys instead of test keys.
