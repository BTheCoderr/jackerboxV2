# JackerBox MVP Testing Guide

This guide will help you test the complete user flow in JackerBox to verify that the MVP functionality is working correctly.

## 1. Equipment Owner Journey

### 1.1 User Registration & Profile Setup
1. Visit http://localhost:3001/auth/register
2. Create a new account with:
   - Name: Test Owner
   - Email: testowner@example.com
   - Password: password123
3. After registration, you'll be redirected to the dashboard
4. Go to your profile settings and update your profile:
   - Set user type to "owner" or "both"
   - Save changes

### 1.2 Create Equipment Listing
1. Navigate to http://localhost:3001/routes/equipment/new
2. Fill out the equipment form:
   - Title: Professional DSLR Camera Kit
   - Description: Complete DSLR camera kit including tripod, lenses, and lighting accessories. Perfect for professional photoshoots.
   - Category: Photography
   - Tags: Canon, DSLR, 4K, Professional
   - Condition: Good
   - Location: San Francisco, CA
   - Daily Rate: $75
   - Security Deposit: $200
   - Upload at least 5 images (use the placeholder images from public/images/equipment)
3. Submit the form
4. Verify the equipment appears on the listings page

### 1.3 Handle Rental Requests
1. Once a renter submits a request (see Renter Journey), you'll receive a notification
2. Go to your dashboard and check the "Owner" tab
3. View the rental request and approve it
4. Use the messaging system to coordinate with the renter
5. Once the rental period is complete, mark the rental as completed
6. Respond to any reviews the renter leaves

## 2. Equipment Renter Journey

### 2.1 User Registration & Profile Setup
1. Open a new incognito window
2. Visit http://localhost:3001/auth/register
3. Create a new account with:
   - Name: Test Renter
   - Email: testrenter@example.com
   - Password: password123
4. After registration, you'll be redirected to the dashboard
5. Go to your profile settings and update your profile:
   - Set user type to "renter" or "both"
   - Save changes

### 2.2 Browse and Book Equipment
1. Navigate to http://localhost:3001/routes/equipment
2. Use filters to find equipment by category "Photography"
3. Click on the DSLR Camera Kit listing
4. Review equipment details and available dates
5. Click "Rent This Equipment"
6. Select start and end dates for your rental
7. Review rental details and total price
8. Submit the booking request
9. Complete the mock payment process

### 2.3 Manage Your Booking
1. Go to your dashboard and check the "Renter" tab
2. View your booking details
3. Send a message to the equipment owner
4. Once the rental period is complete, mark the rental as completed
5. Leave a review for the equipment and owner

## 3. Admin Journey

### 3.1 Admin Login
1. Use the admin credentials to log in:
   - Email: admin@jackerbox.com
   - Password: [admin_password]

### 3.2 Content Moderation
1. Navigate to http://localhost:3001/routes/admin/equipment
2. Review pending equipment listings
3. Approve, flag, or reject listings based on content

### 3.3 User Management
1. Navigate to http://localhost:3001/routes/admin/users
2. View user accounts
3. Handle verification requests
4. Manage user roles if needed

## Testing Checklist

### Authentication
- [ ] Register new account
- [ ] Login with credentials
- [ ] Switch between user roles
- [ ] Update profile information

### Equipment Management
- [ ] Create equipment listing with 5+ images
- [ ] Edit equipment details
- [ ] View equipment listings
- [ ] Remove equipment listing

### Rental Process
- [ ] Browse and filter equipment
- [ ] Submit rental request
- [ ] Complete mock payment
- [ ] Approve rental as owner
- [ ] Complete rental
- [ ] Leave and respond to reviews

### Communication
- [ ] Send messages between users
- [ ] Receive notifications
- [ ] View notification history

## Common Issues and Troubleshooting

1. **Payment Processing**: The mock payment system should automatically succeed in development mode.

2. **Image Upload**: If Cloudinary uploads fail, the system will fall back to local storage.

3. **Real-time Features**: If socket connections fail, the system will fall back to polling.

4. **Dates**: Ensure you're selecting valid dates for rentals (future dates, not past dates).

5. **User Role Issues**: If you encounter permission errors, verify your user role is set correctly for the action you're trying to perform. 