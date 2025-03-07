# Jackerbox Beta Testing Guide

Thank you for participating in the beta testing of Jackerbox! This guide will help you navigate the testing process and provide valuable feedback.

## Getting Started

### Test Environment

The beta testing environment is available at:
- URL: http://localhost:3001 (or the URL provided to you)
- This is a test environment with test mode enabled
- No real payments or verifications will be processed

### Test Accounts

We've created several test accounts for you to use. Each account has a different role and verification status:

1. **Beta Renter** - For testing the rental experience
   - Email: beta.renter@test.com
   - Password: password123
   - Status: Pre-verified (no verification steps needed)

2. **Beta Owner** - For testing the equipment listing experience
   - Email: beta.owner@test.com
   - Password: password123
   - Status: Pre-verified (no verification steps needed)

3. **Beta Admin** - For testing admin features
   - Email: beta.admin@test.com
   - Password: password123
   - Status: Pre-verified (no verification steps needed)

4. **Beta Unverified** - For testing the verification process
   - Email: beta.unverified@test.com
   - Password: password123
   - Status: Needs verification (you can test the verification flow)

You can also create your own account if you prefer.

## Test Scenarios

Please test the following key scenarios:

### 1. User Registration & Authentication

- Create a new account
- Log in with existing credentials
- Reset password functionality
- Phone verification (for unverified accounts)
  - Use phone number: +15555555555
  - Verification code will always be: 123456
- ID verification through Stripe
  - Select "Verification success" from the dropdown
  - Click "Submit" to complete

### 2. Equipment Listing (Owner Role)

- Create a new equipment listing
- Upload photos (any images will work)
- Set pricing and availability
- Edit an existing listing
- Remove a listing

### 3. Equipment Rental (Renter Role)

- Browse available equipment
- Search and filter equipment
- View equipment details
- Request a rental
- Complete the payment process
  - Use test card: 4242 4242 4242 4242
  - Any future expiration date and any 3-digit CVC
- Manage your rentals
- Leave a review

### 4. Admin Features (Admin Role)

- Review and moderate equipment listings
- Manage user accounts
- View reports and analytics

## Payment Testing

For testing payments:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995
- Any future expiration date and any 3-digit CVC will work

## Providing Feedback

Please document any issues, bugs, or suggestions you encounter during testing:

1. **What were you trying to do?**
2. **What did you expect to happen?**
3. **What actually happened?**
4. **Steps to reproduce the issue**
5. **Screenshots (if possible)**

Send your feedback to: [your-email@example.com]

## Important Notes

- This is a test environment with test mode enabled
- No real payments will be processed
- No real identity verifications will be performed
- No real SMS messages will be sent
- All data in this environment may be reset periodically

Thank you for helping us improve Jackerbox! 