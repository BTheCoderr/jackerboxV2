"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OwnerResponseFormProps {
  reviewId: string;
  existingResponse?: string | null;
  onSuccess?: () => void;
}

export function OwnerResponseForm({
  reviewId,
  existingResponse,
  onSuccess,
}: OwnerResponseFormProps) {
  const router = useRouter();
  const [response, setResponse] = useState(existingResponse || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response.trim()) {
      setError("Response cannot be empty");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const apiResponse = await fetch(`/api/reviews/${reviewId}/owner-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          response: response.trim(),
        }),
      });
      
      if (!apiResponse.ok) {
        const data = await apiResponse.json();
        throw new Error(data.message || "Failed to submit response");
      }
      
      setSuccess("Your response has been submitted successfully");
      
      // Refresh the page or call the success callback
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-medium text-gray-900 mb-2">
        {existingResponse ? "Edit Your Response" : "Respond to this Review"}
      </h4>
      
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Write your response to this review..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          rows={3}
          disabled={isLoading}
        />
        
        <div className="flex justify-end mt-2 space-x-2">
          <button
            type="button"
            onClick={() => setResponse(existingResponse || "")}
            className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading || !response.trim()}
          >
            {isLoading ? "Submitting..." : existingResponse ? "Update Response" : "Submit Response"}
          </button>
        </div>
      </form>
    </div>
  );
} 