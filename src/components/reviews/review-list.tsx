import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { ReviewHelpfulness } from './review-helpfulness';
import { OwnerResponseForm } from './owner-response-form';
import { formatDistanceToNow } from 'date-fns';

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
  userVote?: boolean | null; // true = helpful, false = unhelpful, null = no vote
}

interface ReviewListProps {
  reviews: Review[];
  isOwner?: boolean;
  currentUserId?: string;
  onReviewUpdated?: () => void;
}

export function ReviewList({
  reviews,
  isOwner = false,
  currentUserId,
  onReviewUpdated
}: ReviewListProps) {
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  const toggleExpand = (reviewId: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      i < rating 
        ? <StarIcon key={i} className="h-4 w-4 text-yellow-400" />
        : <StarOutlineIcon key={i} className="h-4 w-4 text-yellow-400" />
    ));
  };

  const isLongReview = (comment: string) => comment.length > 300;

  return (
    <div className="space-y-6">
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No reviews yet.
        </div>
      ) : (
        reviews.map(review => {
          const isExpanded = expandedReviews[review.id] || false;
          const shouldTruncate = isLongReview(review.comment) && !isExpanded;
          
          return (
            <div key={review.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {review.author.image ? (
                      <img 
                        src={review.author.image} 
                        alt={review.author.name || 'User'} 
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm font-medium">
                          {review.author.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{review.author.name || 'Anonymous'}</h4>
                    <div className="flex items-center space-x-1 mt-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </div>
              </div>
              
              <div className="mt-3">
                <p className={`text-gray-700 ${shouldTruncate ? 'line-clamp-3' : ''}`}>
                  {review.comment}
                </p>
                
                {isLongReview(review.comment) && (
                  <button 
                    onClick={() => toggleExpand(review.id)}
                    className="text-blue-600 text-sm mt-1 hover:underline"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
              
              {/* Owner response section */}
              {review.ownerResponse && (
                <div className="mt-4 bg-gray-50 p-3 rounded-md">
                  <h5 className="font-medium text-sm">Owner Response</h5>
                  <p className="text-gray-700 text-sm mt-1">{review.ownerResponse}</p>
                  {review.ownerResponseDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(review.ownerResponseDate), { addSuffix: true })}
                    </p>
                  )}
                </div>
              )}
              
              {/* Owner response form */}
              {isOwner && !review.ownerResponse && (
                <div className="mt-4">
                  <OwnerResponseForm 
                    reviewId={review.id} 
                    onSuccess={onReviewUpdated}
                  />
                </div>
              )}
              
              {/* Helpfulness voting */}
              <div className="mt-4 flex justify-end">
                <ReviewHelpfulness
                  reviewId={review.id}
                  helpfulVotes={review.helpfulVotes}
                  unhelpfulVotes={review.unhelpfulVotes}
                  userVote={review.userVote}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
} 