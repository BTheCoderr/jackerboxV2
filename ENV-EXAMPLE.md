# JackerBox Environment Variables

This document lists all the environment variables required for the application to function properly. Copy these to your `.env.local` file and fill in your own values.

```env
# Main Application Settings
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Database Configuration
DATABASE_URL=your-database-url
DIRECT_DATABASE_URL=your-direct-database-url

# Authentication Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_ID=your-apple-id
APPLE_SECRET=your-apple-secret

# Upstash Redis Configuration (Replace with your own values)
KV_URL=your-redis-url
REDIS_URL=your-redis-url
KV_REST_API_TOKEN=your-kv-rest-api-token
KV_REST_API_READ_ONLY_TOKEN=your-kv-readonly-token
KV_REST_API_URL=your-kv-rest-api-url

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_your_stripe_identity_webhook_secret
STRIPE_ACCOUNT_COUNTRY=US

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# AWS Configuration
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# Email Configuration
EMAIL_FROM=noreply@jackerbox.com
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY=your-firebase-private-key

# Additional Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
WEBHOOK_SECRET=your-webhook-secret

# Arcjet for Rate Limiting
ARCJET_KEY=your-arcjet-key

# Feature Flags
NEXT_PUBLIC_DISABLE_SOCKET=false
```

## Testing with these variables

To test the integrations:

1. Copy the variables above to your `.env.local` file
2. Replace the placeholders with your actual values from:
   - Upstash Redis dashboard
   - Stripe dashboard
   - Cloudinary dashboard
   - AWS console
   - Firebase console

3. Run the integration tests:
   ```
   node scripts/test-integrations.js
   ```

4. For manual testing, start the development server:
   ```
   npm run dev
   ```

5. Visit these testing endpoints:
   - Redis Test: http://localhost:3000/api/redis-test
   - Socket Test: http://localhost:3000/socket-test
   - SSE Test: http://localhost:3000/sse-test
   - Stripe Test: http://localhost:3000/test-stripe 