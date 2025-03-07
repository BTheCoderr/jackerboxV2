"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define the form schema
const responseSchema = z.object({
  response: z.string().min(10, "Response must be at least 10 characters").max(1000, "Response must be less than 1000 characters"),
});

type ResponseFormValues = z.infer<typeof responseSchema>;

interface OwnerResponseFormProps {
  reviewId: string;
  existingResponse?: string;
  onSuccess?: () => void;
}

export function OwnerResponseForm({
  reviewId,
  existingResponse,
  onSuccess,
}: OwnerResponseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response: existingResponse || "",
    },
  });
  
  const onSubmit = async (data: ResponseFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          response: data.response,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit response");
      }
      
      setSuccess("Your response has been submitted successfully");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">
        {existingResponse ? "Edit Your Response" : "Respond to Review"}
      </h3>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-100 text-green-600 rounded-md text-sm mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-1">
            Your Response
          </label>
          <textarea
            id="response"
            {...register("response")}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Write your response to this review..."
            disabled={isLoading}
          />
          {errors.response && (
            <p className="text-red-500 text-xs mt-1">{errors.response.message}</p>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          {existingResponse && (
            <button
              type="button"
              onClick={() => reset({ response: existingResponse })}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : existingResponse ? "Update Response" : "Submit Response"}
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Your response will be publicly visible alongside the review.</p>
        <p>Be professional and courteous, even if responding to a negative review.</p>
      </div>
    </div>
  );
} 