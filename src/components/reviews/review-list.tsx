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

export function ReviewList({ reviews, isOwner = false, currentUserId, onReviewUpdated }: ReviewListProps) {
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  
  const toggleExpand = (reviewId: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };
  
  const handleResponseSuccess = () => {
    setRespondingTo(null);
    if (onReviewUpdated) {
      onReviewUpdated();
    }
  };
  
  if (reviews.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No reviews yet</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        const isExpanded = expandedReviews[review.id] || false;
        const isLongComment = review.comment.length > 300;
        const displayComment = isLongComment && !isExpanded
          ? `${review.comment.substring(0, 300)}...`
          : review.comment;
        
        return (
          <div key={review.id} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                {review.author.image ? (
                  <img
                    src={review.author.image}
                    alt={review.author.name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 font-medium">
                      {review.author.name ? review.author.name.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {review.author.name || "Anonymous User"}
                    </h4>
                    <div className="flex items-center mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star}>
                            {star <= review.rating ? (
                              <StarIcon className="h-4 w-4 text-yellow-400" />
                            ) : (
                              <StarOutlineIcon className="h-4 w-4 text-yellow-400" />
                            )}
                          </span>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 text-gray-700">
                  <p>{displayComment}</p>
                  
                  {isLongComment && (
                    <button
                      onClick={() => toggleExpand(review.id)}
                      className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
                
                <div className="mt-3">
                  <ReviewHelpfulness
                    reviewId={review.id}
                    helpfulVotes={review.helpfulVotes}
                    unhelpfulVotes={review.unhelpfulVotes}
                    userVote={review.userVote}
                  />
                </div>
                
                {/* Owner Response */}
                {review.ownerResponse && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">Owner Response</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {review.ownerResponseDate
                          ? formatDistanceToNow(new Date(review.ownerResponseDate), { addSuffix: true })
                          : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{review.ownerResponse}</p>
                    
                    {isOwner && (
                      <button
                        onClick={() => setRespondingTo(review.id)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Edit Response
                      </button>
                    )}
                  </div>
                )}
                
                {/* Owner Response Form */}
                {isOwner && (
                  <>
                    {respondingTo === review.id ? (
                      <OwnerResponseForm
                        reviewId={review.id}
                        existingResponse={review.ownerResponse}
                        onSuccess={handleResponseSuccess}
                      />
                    ) : (
                      !review.ownerResponse && (
                        <button
                          onClick={() => setRespondingTo(review.id)}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Respond to this review
                        </button>
                      )
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 