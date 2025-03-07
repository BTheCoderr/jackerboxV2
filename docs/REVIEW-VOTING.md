# Review Voting Feature

This document explains the review voting feature implemented in the Jackerbox platform, which allows users to vote on the helpfulness of reviews.

## Overview

The review voting feature enhances the review system by allowing users to indicate whether they found a review helpful or not. This helps other users identify the most valuable reviews and provides feedback to reviewers.

## Components

### 1. Database Schema

The feature is built on two main models in the Prisma schema:

- **Review Model**: Enhanced with `helpfulVotes` and `unhelpfulVotes` fields to track the number of votes.
- **ReviewVote Model**: A new model that tracks individual votes with a unique constraint to ensure each user can only vote once per review.

```prisma
model Review {
  // Existing fields
  helpfulVotes Int @default(0)
  unhelpfulVotes Int @default(0)
  votes ReviewVote[]
}

model ReviewVote {
  id String @id @default(cuid())
  reviewId String
  userId String
  isHelpful Boolean
  createdAt DateTime @default(now())
  
  review Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([reviewId, userId])
}
```

### 2. API Endpoints

The feature includes several API endpoints:

- **POST /api/reviews/[id]/vote**: Submit a vote (helpful or unhelpful) for a review
- **DELETE /api/reviews/[id]/vote**: Remove a vote from a review
- **GET /api/reviews/[id]/user-vote**: Get the current user's vote for a review
- **GET /api/reviews/statistics**: Get statistics about reviews, including vote counts

### 3. UI Components

The feature includes several React components:

- **ReviewHelpfulness**: Displays voting buttons and counts for a single review
- **ReviewStatistics**: Displays statistics about reviews, including helpfulness percentages
- **ReviewList**: Displays a list of reviews with voting functionality
- **ReviewsSection**: Combines statistics and review list into a single component

### 4. Hooks

Custom React hooks for managing review votes:

- **useReviewVote**: Manages the state and API calls for voting on a review
- **useReviewStatistics**: Fetches and manages review statistics

## User Flow

1. User views a review on an equipment detail page
2. User can click "Helpful" or "Unhelpful" to vote on the review
3. If the user has already voted, clicking the same button again removes their vote
4. If the user has already voted differently, clicking a new button changes their vote
5. Vote counts update in real-time without page refresh

## Implementation Details

### Vote Submission

When a user submits a vote:

1. The system checks if the user has already voted on this review
2. If they have, and they're voting the same way, their vote is removed
3. If they have, but they're voting differently, their vote is changed
4. If they haven't voted yet, a new vote is created
5. The review's vote counts are updated accordingly

### Vote Removal

When a user removes a vote:

1. The system deletes the vote record from the database
2. The review's vote counts are updated accordingly

### Statistics Calculation

Review statistics include:

- Average rating
- Total number of reviews
- Distribution of ratings (how many 5-star, 4-star, etc.)
- Total helpful and unhelpful votes
- Helpfulness percentage (helpful votes / total votes)

## Testing

A test script (`scripts/test-review-votes.js`) is provided to test the voting functionality. It:

1. Creates a test review if none exists
2. Finds test users to act as voters
3. Adds test votes to the review
4. Updates the review's vote counts
5. Verifies that the votes were recorded correctly

## Future Enhancements

Potential future enhancements to the review voting system:

1. Sorting reviews by helpfulness
2. Filtering reviews by minimum helpfulness percentage
3. Rewarding users whose reviews are consistently voted as helpful
4. Hiding reviews that receive many unhelpful votes
5. Adding a "Report" button for inappropriate reviews

## Conclusion

The review voting feature enhances the user experience by helping users identify the most valuable reviews. It also provides feedback to reviewers about the quality of their reviews, encouraging more helpful reviews in the future. 