# JackerBox MVP 0.1.0 Release Notes

## Release Date: 2023-TBD

JackerBox is a peer-to-peer equipment rental platform that allows users to rent equipment from other users or list their own equipment for rent. This MVP (Minimum Viable Product) release includes the core functionality needed for the platform to operate.

## Features

### User Management
- **User Registration and Authentication**: Register with email/password or Google OAuth
- **User Profiles**: Complete user profiles with name, email, and profile picture
- **Role-Based Access**: Users can operate as renters, equipment owners, or both
- **Profile Settings**: Users can update their profile information and switch roles

### Equipment Management
- **Equipment Listings**: Create, edit, and manage equipment listings
- **Rich Media Support**: Upload multiple images (5 minimum) for each listing
- **Equipment Categories**: Browse equipment by category, condition, and location
- **Search and Filtering**: Find equipment based on multiple criteria

### Rental Process
- **Booking Calendar**: Select rental dates from an availability calendar
- **Rental Requests**: Submit and manage rental requests
- **Owner Approval**: Equipment owners can approve or reject rental requests
- **Payment Processing**: Secure mock payment system (real payments in production)
- **Rental Completion**: Both parties can mark rentals as complete

### Communication
- **Messaging System**: In-app messaging between renters and owners
- **Notifications**: Receive notifications for important events
- **Reviews and Ratings**: Leave and view reviews for equipment and owners

### Admin Features
- **Admin Dashboard**: Comprehensive overview of platform activity
- **Content Moderation**: Review and moderate equipment listings
- **User Management**: Manage user accounts and permissions

## Technical Enhancements
- **Mobile Optimization**: Fully responsive design for all screen sizes
- **Performance Improvements**: Fast page loads and efficient database queries
- **Development Mode Helpers**: 
  - Mock payment processing
  - Local image storage fallbacks
  - Simulated authentication

## Known Limitations
The following features are planned for future releases:
- Equipment availability calendar for blocking out dates
- ID verification flow
- Push notifications
- File attachments in messaging
- Security deposit handling enhancements

## Getting Started
For development and testing:
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your .env file
4. Start the development server: `npm run dev -- -p 3001`
5. Follow the testing guides in QUICK-TEST.md and TEST-USER-JOURNEY.md

## Feedback
We welcome feedback on this MVP release. Please submit any bugs or feature requests through the appropriate channels.

---

© 2023 JackerBox - All rights reserved 