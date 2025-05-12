# JackerBox Testing Plan

This document outlines how to test the various components of the JackerBox application to ensure everything is working correctly.

## Prerequisites

Before testing, make sure you have:
1. Set up all environment variables (see `.env.example`)
2. Run the local development server with `npm run dev`
3. Ensured your database is properly connected
4. Verified Redis connection is active

## 1. Authentication Testing

### Testing Google/Apple OAuth

1. Visit `/auth/login`
2. Click on "Continue with Google" or "Continue with Apple"
3. Complete the OAuth flow
4. Verify you're redirected to the dashboard
5. Check that your user profile information is correctly displayed

### Testing Credentials Authentication

1. Visit `/auth/register` to create a test account
2. Fill in the registration form with valid information
3. Submit the form and verify account creation
4. Log out
5. Visit `/auth/login`
6. Enter the credentials you just created
7. Verify successful login and redirection to dashboard

## 2. Redis and Real-time Features Testing

### Testing Redis Connection

1. Visit `/api/redis-test` in your browser
2. Verify the response shows a successful connection
3. Try the POST endpoint with a tool like Postman:
   ```
   POST /api/redis-test
   Content-Type: application/json
   
   {
     "key": "test-key",
     "value": "test-value"
   }
   ```
4. Verify the successful storage response

### Testing Socket Connection

1. Visit `/socket-test` in your browser
2. Verify the socket connection status shows "Connected"
3. Open another browser window to the same page
4. Send a test message from one window
5. Verify the message appears in the other window

### Testing SSE (Server-Sent Events)

1. Visit `/sse-test` in your browser
2. Verify you see "SSE Connection: Active"
3. Use the admin panel or API to publish a test event
4. Verify the event appears in the test page

## 3. Stripe Integration Testing

### Testing Payment Flow

1. Create a test rental listing (if needed)
2. Navigate to the rental listing and click "Rent Now"
3. Proceed to the payment page
4. Use Stripe test card `4242 4242 4242 4242` with:
   - Any future expiration date
   - Any 3-digit CVC
   - Any billing ZIP code
5. Complete the payment
6. Verify the payment success screen and confirmation

### Testing Connect Account

1. Navigate to `/routes/dashboard/stripe-connect`
2. Initiate the Stripe Connect onboarding
3. Complete the test onboarding flow
4. Verify the account is connected successfully

## 4. Cloudinary Integration Testing

### Testing Image Upload

1. Navigate to a page with the image uploader (e.g., equipment creation)
2. Upload a test image
3. Verify the image appears in the preview
4. Complete the form submission
5. Verify the image is stored in Cloudinary and displayed correctly

## 5. API Route Testing

Use tools like Postman or Thunder Client to test the following API endpoints:

1. `/api/equipment` - GET, POST
2. `/api/equipment/[id]` - GET, PUT, DELETE
3. `/api/users/[id]` - GET, PUT
4. `/api/rentals` - GET, POST
5. `/api/payments/create-intent` - POST

## 6. Mobile Responsiveness

Test the application on various device sizes:

1. Desktop (1920×1080)
2. Laptop (1366×768)
3. Tablet (768×1024)
4. Mobile (375×667)

Verify that all UI elements are properly responsive and usable on each device size.

## 7. Error Handling Testing

Test error scenarios:

1. Try invalid login credentials
2. Test form validation (submit empty forms, invalid data)
3. Test with invalid API parameters
4. Test payment with invalid card numbers
5. Test with network disconnection during operations

## 8. Performance Testing

1. Page load times
2. Image loading speed
3. API response times
4. Animation smoothness

## 9. Deployment Verification

After deploying to Vercel:

1. Verify all pages load correctly
2. Test authentication flows
3. Confirm Redis connection works
4. Confirm Stripe integrations work
5. Verify Cloudinary uploads work
6. Test real-time features (socket, SSE)

## Reporting Issues

When you encounter issues:

1. Document the exact steps to reproduce
2. Note the expected vs. actual behavior
3. Include browser console logs if relevant
4. Take screenshots of the issue
5. Add information about your environment (browser, OS, etc.)

## Documenting Results

For each test, document:
- ✅ Passing tests
- ❌ Failing tests (with detailed description)
- ⚠️ Partially working features (with notes on limitations) 