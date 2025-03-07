import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface UseReviewVoteOptions {
  reviewId: string;
  initialVote?: boolean | null;
  enabled?: boolean;
}

export function useReviewVote({
  reviewId,
  initialVote = null,
  enabled = true
}: UseReviewVoteOptions) {
  const [vote, setVote] = useState<boolean | null>(initialVote);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !reviewId) return;

    const fetchUserVote = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/reviews/${reviewId}/user-vote`);
        
        if (!response.ok) {
          // If unauthorized, just set vote to null
          if (response.status === 401) {
            setVote(null);
            return;
          }
          
          throw new Error('Failed to fetch user vote');
        }
        
        const data = await response.json();
        setVote(data.vote);
      } catch (err) {
        console.error('Error fetching user vote:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserVote();
  }, [reviewId, enabled]);
  
  const submitVote = async (isHelpful: boolean) => {
    if (!reviewId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isHelpful })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('You must be logged in to vote');
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit vote');
      }
      
      const data = await response.json();
      setVote(isHelpful);
      return data;
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsLoading(false);
    }
  };
  
  const removeVote = async () => {
    if (!reviewId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('You must be logged in to remove your vote');
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove vote');
      }
      
      const data = await response.json();
      setVote(null);
      return data;
    } catch (err) {
      console.error('Error removing vote:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error(err instanceof Error ? err.message : 'Failed to remove vote');
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    vote,
    isLoading,
    error,
    submitVote,
    removeVote
  };
} 