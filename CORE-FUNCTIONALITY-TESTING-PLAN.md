# JackerBox Core Functionality Testing Plan

This document outlines the testing plan for validating the core functionality of JackerBox.

## 1. Authentication Testing

### User Registration Testing

1. **Happy Path Registration**
   - Navigate to `/auth/register`
   - Fill in valid details:
     - Name: "Test User"
     - Email: "testuser@example.com"
     - Phone: "1234567890"
     - Password: "TestPassword123"
     - Confirm password: "TestPassword123"
     - User type: "Both"
   - Submit the form
   - Verify successful registration and redirection to dashboard
   - Verify welcome email is received

2. **Email Validation**
   - Test with invalid email format
   - Verify appropriate error message is displayed

3. **Password Validation**
   - Test with short password (less than 8 characters)
   - Test with mismatched password and confirmation
   - Verify appropriate error messages are displayed

4. **Duplicate Account**
   - Test registering with an email already in use
   - Verify appropriate error message is displayed

### User Login Testing

1. **Email/Password Login**
   - Navigate to `/auth/login`
   - Enter valid credentials
   - Verify successful login and redirection to dashboard

2. **Invalid Credentials**
   - Test with incorrect email/password combination
   - Verify appropriate error message is displayed

3. **Social Login**
   - Test Google login functionality
   - Test Apple login functionality (if available)
   - Verify successful authentication and account linking

### Profile Management

1. **View Profile**
   - Navigate to profile page
   - Verify user information is correctly displayed

2. **Update Profile**
   - Edit profile information (name, bio, etc.)
   - Save changes
   - Verify updated information is displayed

3. **Update Phone Number**
   - Add or update phone number
   - Verify phone verification process works

## 2. Equipment Listing Testing

### Create Equipment Listing

1. **Basic Listing Creation**
   - Navigate to create listing page
   - Fill all required fields:
     - Title
     - Description
     - Condition
     - Category
     - Location
     - At least one pricing option (hourly, daily, or weekly)
   - Upload at least 7 images
   - Submit the form
   - Verify listing is created and visible in user's listings

2. **Image Upload Testing**
   - Test uploading various image formats (JPG, PNG)
   - Test uploading images of different sizes
   - Verify Cloudinary integration works with correct cloud name
   - Verify image verification process

3. **Validation Testing**
   - Test submitting with missing required fields
   - Test submitting with invalid data (e.g., negative prices)
   - Verify appropriate error messages are displayed

### Edit Equipment Listing

1. **Modify Existing Listing**
   - Navigate to an existing listing
   - Update various fields
   - Submit the changes
   - Verify changes are saved and reflected in the listing view

2. **Image Management**
   - Add new images to existing listing
   - Remove images from existing listing
   - Reorder images
   - Verify changes are saved

### Search and Filter Equipment

1. **Basic Search**
   - Navigate to equipment search page
   - Enter search terms
   - Verify relevant results are displayed

2. **Category Filtering**
   - Filter by different equipment categories
   - Verify results are appropriately filtered

3. **Price Filtering**
   - Filter by price range
   - Verify results are within the specified range

4. **Location Filtering**
   - Filter by location
   - Verify results are appropriate for the specified location

5. **Availability Filtering**
   - Filter by available dates
   - Verify results show only equipment available during specified period

## 3. Booking and Rental Testing

### Create Booking

1. **Happy Path Booking**
   - Select an equipment listing
   - Choose rental dates
   - Verify price calculation is correct
   - Proceed to checkout
   - Complete payment with test card
   - Verify booking is confirmed and appears in user's rentals

2. **Date Selection**
   - Test selecting dates when equipment is not available
   - Verify appropriate warnings/errors are displayed

3. **Price Calculation**
   - Test different date ranges (hourly, daily, weekly)
   - Verify price calculations include security deposit
   - Verify tax/fees calculation

### Payment Processing

1. **Credit Card Payment**
   - Test successful payment with test card
   - Verify payment receipt is generated
   - Verify payment appears in user's payment history

2. **Failed Payment**
   - Test payment with declined card
   - Verify appropriate error message
   - Verify booking is not confirmed

3. **Security Deposit**
   - Verify security deposit is correctly added to payment
   - Test refund process after successful rental

### Rental Management

1. **View Active Rentals**
   - Navigate to dashboard rentals section
   - Verify active rentals are displayed with correct status

2. **Cancel Rental**
   - Select an active rental
   - Initiate cancellation
   - Verify rental status is updated
   - Verify refund process (if applicable)

3. **Complete Rental**
   - Test rental completion flow
   - Verify status changes and security deposit handling

4. **Review System**
   - Complete a rental
   - Submit a review
   - Verify review is displayed on equipment listing
   - Test owner response to review

## 4. Notifications and Messaging

### Notification System

1. **In-App Notifications**
   - Perform actions that generate notifications:
     - Create booking
     - Receive payment
     - Cancel booking
   - Verify notifications appear in notification center
   - Verify notification count badge
   - Test marking notifications as read

2. **Email Notifications**
   - Verify transactional emails are sent:
     - Registration confirmation
     - Booking confirmation
     - Payment confirmation
     - Rental status updates

3. **Push Notifications**
   - Enable push notifications in browser
   - Verify push notifications are received (if implemented)

### Messaging System

1. **Send Messages**
   - Navigate to a listing
   - Send message to owner
   - Verify message appears in conversation

2. **Respond to Messages**
   - Receive message (as owner)
   - Reply to message
   - Verify reply appears in conversation for both users

3. **Conversation Management**
   - View all conversations
   - Filter conversations
   - Archive/delete conversations

## 5. Equipment Owner Features

### Listing Management

1. **View Owner Listings**
   - Navigate to owner dashboard
   - Verify all listings are displayed with status

2. **Availability Management**
   - Update equipment availability
   - Block dates
   - Set recurring availability patterns
   - Verify calendar reflects changes

### Rental Approvals

1. **Rental Request Approval**
   - Receive booking request
   - Approve request
   - Verify renter is notified
   - Verify status changes

2. **Rental Request Rejection**
   - Receive booking request
   - Reject request
   - Verify renter is notified
   - Verify status changes

### Payouts

1. **View Earnings**
   - Navigate to earnings dashboard
   - Verify completed rentals show correct payout amounts

2. **Initiate Payout**
   - Request payout
   - Verify payout processing
   - Verify transaction appears in payment history

## Testing Tools

### Manual Testing
- Browser testing (Chrome, Firefox, Safari)
- Mobile responsiveness testing
- Detailed logging of test results

### API Testing
- Use Postman to test API endpoints directly
- Validate request/response formats
- Test error handling

### Test Accounts
- Create test accounts for both renters and owners
- Use Stripe test cards for payment testing
- Use test mode for external integrations

## Expected Deliverables

1. Completed test checklist with pass/fail status
2. Documentation of any bugs or issues found
3. Recommendations for improvements
4. Performance metrics for critical flows 