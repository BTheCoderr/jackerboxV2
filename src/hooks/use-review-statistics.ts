import { useState, useEffect } from 'react';

interface ReviewStatistics {
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<number, number>;
  helpfulVotes: number;
  unhelpfulVotes: number;
}

interface UseReviewStatisticsOptions {
  equipmentId?: string;
  userId?: string;
  enabled?: boolean;
}

export function useReviewStatistics({
  equipmentId,
  userId,
  enabled = true
}: UseReviewStatisticsOptions) {
  const [statistics, setStatistics] = useState<ReviewStatistics>({
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    helpfulVotes: 0,
    unhelpfulVotes: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || (!equipmentId && !userId)) return;

    const fetchStatistics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (equipmentId) params.append('equipmentId', equipmentId);
        if (userId) params.append('userId', userId);
        
        const response = await fetch(`/api/reviews/statistics?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch review statistics');
        }
        
        const data = await response.json();
        setStatistics(data);
      } catch (err) {
        console.error('Error fetching review statistics:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStatistics();
  }, [equipmentId, userId, enabled]);
  
  const refetch = async () => {
    if (!enabled || (!equipmentId && !userId)) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (equipmentId) params.append('equipmentId', equipmentId);
      if (userId) params.append('userId', userId);
      
      const response = await fetch(`/api/reviews/statistics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch review statistics');
      }
      
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error('Error fetching review statistics:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    statistics,
    isLoading,
    error,
    refetch
  };
} 