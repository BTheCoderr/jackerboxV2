'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReviewStatistics } from './review-statistics';
import { ReviewList } from './review-list';
import { useReviewStatistics } from '@/hooks/use-review-statistics';
import dynamic from 'next/dynamic';

// Lazy load the ReviewList component
const LazyReviewList = dynamic(() => import('./review-list').then(mod => ({ default: mod.ReviewList })), {
  loading: () => (
    <div className="text-center py-4">
      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]" role="status">
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading reviews...</span>
      </div>
    </div>
  ),
  ssr: false
});

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
  ownerResponse?: string | null;
  ownerResponseDate?: Date | null;
  helpfulVotes: number;
  unhelpfulVotes: number;
  userVote?: boolean | null;
}

interface ReviewsSectionProps {
  equipmentId?: string;
  userId?: string;
  isOwner?: boolean;
  currentUserId?: string;
}

export function ReviewsSection({
  equipmentId,
  userId,
  isOwner = false,
  currentUserId
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { statistics, isLoading: statsLoading, refetch: refetchStats } = useReviewStatistics({
    equipmentId,
    userId
  });
  
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (equipmentId) params.append('equipmentId', equipmentId);
      if (userId) params.append('userId', userId);
      
      const response = await fetch(`/api/reviews?${params.toString()}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const reviewsData = await response.json();
      
      // If user is logged in, fetch their votes for each review
      if (currentUserId) {
        const reviewsWithVotes = await Promise.all(
          reviewsData.map(async (review: Review) => {
            try {
              const voteResponse = await fetch(`/api/reviews/${review.id}/user-vote`, {
                cache: 'no-store'
              });
              
              if (voteResponse.ok) {
                const voteData = await voteResponse.json();
                return {
                  ...review,
                  userVote: voteData.vote
                };
              }
            } catch (err) {
              console.error('Error fetching vote for review:', err);
            }
            
            return review;
          })
        );
        
        setReviews(reviewsWithVotes);
      } else {
        setReviews(reviewsData);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId, userId, currentUserId]);
  
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);
  
  const handleReviewUpdated = useCallback(() => {
    fetchReviews();
    refetchStats();
  }, [fetchReviews, refetchStats]);
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Reviews</h2>
      
      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Error loading reviews: {error}
        </div>
      ) : isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {statistics.totalReviews > 0 && (
            <ReviewStatistics
              averageRating={statistics.averageRating}
              totalReviews={statistics.totalReviews}
              ratingCounts={statistics.ratingCounts}
              helpfulVotes={statistics.helpfulVotes}
              unhelpfulVotes={statistics.unhelpfulVotes}
            />
          )}
          
          <LazyReviewList
            reviews={reviews}
            isOwner={isOwner}
            currentUserId={currentUserId}
            onReviewUpdated={handleReviewUpdated}
          />
        </>
      )}
    </div>
  );
} 