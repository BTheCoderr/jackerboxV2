"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useReviewVote } from '@/hooks/use-review-vote';

interface ReviewHelpfulnessProps {
  reviewId: string;
  helpfulVotes: number;
  unhelpfulVotes: number;
  userVote?: boolean | null; // true = helpful, false = unhelpful, null = no vote
}

export function ReviewHelpfulness({
  reviewId,
  helpfulVotes: initialHelpfulVotes,
  unhelpfulVotes: initialUnhelpfulVotes,
  userVote: initialUserVote,
}: ReviewHelpfulnessProps) {
  const [helpfulVotes, setHelpfulVotes] = useState(initialHelpfulVotes);
  const [unhelpfulVotes, setUnhelpfulVotes] = useState(initialUnhelpfulVotes);
  
  const { vote, isLoading, submitVote, removeVote } = useReviewVote({
    reviewId,
    initialVote: initialUserVote
  });

  const handleVote = async (isHelpful: boolean) => {
    if (isLoading) return;
    
    try {
      // If already voted the same way, remove the vote
      if (vote === isHelpful) {
        const result = await removeVote();
        if (result) {
          setHelpfulVotes(result.helpfulVotes);
          setUnhelpfulVotes(result.unhelpfulVotes);
        }
        return;
      }
      
      // Otherwise submit or change vote
      const result = await submitVote(isHelpful);
      if (result) {
        setHelpfulVotes(result.helpfulVotes);
        setUnhelpfulVotes(result.unhelpfulVotes);
      }
    } catch (error) {
      console.error('Error handling vote:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4 text-sm">
      <span className="text-gray-500">Was this review helpful?</span>
      
      <button
        onClick={() => handleVote(true)}
        className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
          vote === true 
            ? 'text-green-600 bg-green-50' 
            : 'text-gray-500 hover:bg-gray-100'
        }`}
        disabled={isLoading}
      >
        <ThumbsUp className={`h-4 w-4 ${vote === true ? 'fill-green-600' : ''}`} />
        <span>{helpfulVotes}</span>
      </button>
      
      <button
        onClick={() => handleVote(false)}
        className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
          vote === false 
            ? 'text-red-600 bg-red-50' 
            : 'text-gray-500 hover:bg-gray-100'
        }`}
        disabled={isLoading}
      >
        <ThumbsDown className={`h-4 w-4 ${vote === false ? 'fill-red-600' : ''}`} />
        <span>{unhelpfulVotes}</span>
      </button>
    </div>
  );
} 