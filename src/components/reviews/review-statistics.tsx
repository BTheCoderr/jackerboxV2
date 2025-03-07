import { useState, useEffect, ReactNode } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface ReviewStatisticsProps {
  averageRating: number;
  totalReviews: number;
  ratingCounts?: Record<number, number>; // e.g. { 5: 10, 4: 5, 3: 2, 2: 1, 1: 0 }
  helpfulVotes?: number;
  unhelpfulVotes?: number;
}

export function ReviewStatistics({
  averageRating,
  totalReviews,
  ratingCounts = {},
  helpfulVotes = 0,
  unhelpfulVotes = 0,
}: ReviewStatisticsProps) {
  const [helpfulPercentage, setHelpfulPercentage] = useState(0);

  useEffect(() => {
    const totalVotes = helpfulVotes + unhelpfulVotes;
    if (totalVotes > 0) {
      setHelpfulPercentage(Math.round((helpfulVotes / totalVotes) * 100));
    }
  }, [helpfulVotes, unhelpfulVotes]);

  // Calculate percentage for each rating
  const calculatePercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  // Generate stars for average rating
  const renderStars = (rating: number) => {
    const stars: ReactNode[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<StarIcon key={i} className="h-5 w-5 text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarOutlineIcon className="h-5 w-5 text-yellow-400" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <StarIcon className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<StarOutlineIcon key={i} className="h-5 w-5 text-yellow-400" />);
      }
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Average rating section */}
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-2xl font-bold">{averageRating.toFixed(1)}</h3>
          <div className="flex items-center my-2">
            {renderStars(averageRating)}
          </div>
          <p className="text-gray-600">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
        </div>

        {/* Rating breakdown */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-3">Rating Breakdown</h3>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center mb-2">
              <span className="w-12 text-sm">{rating} stars</span>
              <div className="flex-1 mx-3">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-yellow-400 rounded-full"
                    style={{ width: `${calculatePercentage(ratingCounts[rating] || 0)}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm text-gray-600 w-10">
                {calculatePercentage(ratingCounts[rating] || 0)}%
              </span>
            </div>
          ))}
        </div>

        {/* Helpfulness stats */}
        {(helpfulVotes > 0 || unhelpfulVotes > 0) && (
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-3">Helpfulness</h3>
            <div className="w-24 h-24 relative rounded-full flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#4ADE80"
                  strokeWidth="3"
                  strokeDasharray={`${helpfulPercentage}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{helpfulPercentage}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {helpfulVotes} of {helpfulVotes + unhelpfulVotes} found helpful
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 