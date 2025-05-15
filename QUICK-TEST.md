# JackerBox Quick MVP Testing Script

This script provides a rapid testing approach to verify the key functionality of JackerBox MVP.

## 1. User Role Switching Test

### Test A: Register and Switch Roles
1. Open http://localhost:3001/auth/register in your browser
2. Create a new test account
3. Go to Profile settings (/routes/profile)
4. Try switching between:
   - Renter Only
   - Owner Only
   - Both
5. Verify role restrictions:
   - As Renter: Should NOT see "Add Equipment" in menu
   - As Owner: Should NOT be able to rent equipment
   - As Both: Should see all options

### Test B: Role Restrictions
1. While in "Renter" role, manually navigate to http://localhost:3001/routes/equipment/new
2. Verify you're redirected with an error message
3. Switch to "Owner" role and verify you can access the page

## 2. Equipment Listing Creation Test

1. Ensure you're in "Owner" or "Both" role
2. Navigate to http://localhost:3001/routes/equipment/new
3. Fill out the form but only upload 3 images
4. Verify form validation shows an error requiring 5 images
5. Upload 2 more images (5 total)
6. Submit the form
7. Verify the listing appears on the equipment listing page

## 3. Mock Payment Processing Test

1. Switch to "Renter" role (or use a different account)
2. Find and click on an equipment listing
3. Click "Rent This Equipment"
4. Select dates and submit the request
5. Complete the payment process
6. Verify that a success message appears
7. Check the dashboard to confirm the rental appears

## 4. Dashboard Verification

1. Login as equipment owner
2. Navigate to dashboard
3. Verify that the Owner tab shows your equipment and incoming rental requests
4. Login as renter
5. Verify that the Renter tab shows your active rentals
6. Verify that each dashboard view displays the appropriate role-specific content

## 5. Notification System Test

1. Login as renter and make a rental request
2. Login as owner and check for the notification
3. Click the notification bell
4. Verify notification content is correct
5. Verify clicking on notification navigates to correct page

## 6. Review System Test

1. Login as equipment owner
2. Navigate to an active rental and mark it as completed
3. Login as renter
4. Navigate to completed rental
5. Submit a review
6. Verify the review appears on the equipment page

## 7. Mobile Responsiveness Test

1. Use Chrome DevTools to simulate mobile device (iPhone 12)
2. Navigate through:
   - Home page
   - Equipment listings
   - Equipment detail
   - Dashboard
3. Verify mobile navigation works correctly
4. Verify forms are usable on mobile

## Notes on Testing

- **Development Mode Helpers**: The system automatically enables:
  - Mock payments (no real Stripe needed)
  - Local image storage fallbacks
  - Simulated authentication
  
- **Test Data**: If you need more test equipment, you can quickly create several listings with the required 5 images using the placeholder images in public/images/equipment

- **Error Simulation**: For any API errors, check the browser console for details

All tests should be performed with the server running on port 3001. 