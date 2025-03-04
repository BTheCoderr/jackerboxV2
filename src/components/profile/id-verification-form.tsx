"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define the form schema
const idVerificationSchema = z.object({
  documentType: z.enum(["passport", "driver_license", "national_id"], {
    required_error: "Please select a document type",
  }),
});

type IdVerificationFormValues = z.infer<typeof idVerificationSchema>;

interface IdVerificationFormProps {
  user: {
    id: string;
    idVerified?: boolean;
    idVerificationStatus?: string | null;
    idDocumentType?: string | null;
    idVerificationDate?: Date | null;
  };
}

export function IdVerificationForm({ user }: IdVerificationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IdVerificationFormValues>({
    resolver: zodResolver(idVerificationSchema),
    defaultValues: {
      documentType: (user.idDocumentType as "passport" | "driver_license" | "national_id") || undefined,
    },
  });
  
  const handleIdDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a preview URL for the UI
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    
    // In a real app, you would upload to Cloudinary here
    // For now, we'll just simulate with the local URL
    setIdDocumentUrl(preview);
  };
  
  const onSubmit = async (data: IdVerificationFormValues) => {
    if (!idDocumentUrl) {
      setError("Please upload an ID document");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch("/api/users/verify-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idDocumentUrl,
          documentType: data.documentType,
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to verify ID");
      }
      
      setSuccess(
        responseData.isValid
          ? "Your ID has been verified successfully!"
          : "Your ID has been submitted for review. We'll notify you once it's verified."
      );
      
      router.refresh();
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
  
  // Show different UI based on verification status
  if (user.idVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h3 className="text-lg font-medium text-green-800">ID Verified</h3>
        </div>
        <p className="text-sm text-green-700 mt-1">
          Your identity has been verified on {user.idVerificationDate ? new Date(user.idVerificationDate).toLocaleDateString() : 'N/A'}.
        </p>
      </div>
    );
  }
  
  if (user.idVerificationStatus === "pending") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800">Verification Pending</h3>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          Your ID verification is being processed. We'll notify you once it's complete.
        </p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Verify Your Identity</h2>
      <p className="text-gray-600 mb-4">
        To ensure the safety of our community, we require all users to verify their identity before listing equipment or making rentals.
      </p>
      
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
        <div className="space-y-1">
          <label htmlFor="documentType" className="text-sm font-medium">
            Document Type
          </label>
          <select
            id="documentType"
            {...register("documentType")}
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
          >
            <option value="">Select a document type</option>
            <option value="passport">Passport</option>
            <option value="driver_license">Driver's License</option>
            <option value="national_id">National ID Card</option>
          </select>
          {errors.documentType && (
            <p className="text-red-500 text-xs mt-1">{errors.documentType.message}</p>
          )}
        </div>
        
        <div className="space-y-1">
          <label htmlFor="idDocument" className="text-sm font-medium">
            Upload ID Document
          </label>
          <input
            id="idDocument"
            type="file"
            accept="image/*"
            onChange={handleIdDocumentUpload}
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Please upload a clear image of your ID document. We accept passport, driver's license, or national ID card.
          </p>
        </div>
        
        {previewUrl && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Preview:</p>
            <div className="relative w-full max-w-md h-48 border rounded-md overflow-hidden">
              <img
                src={previewUrl}
                alt="ID Document Preview"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
        
        <button
          type="submit"
          className="w-full py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          disabled={isLoading || !idDocumentUrl}
        >
          {isLoading ? "Verifying..." : "Verify ID"}
        </button>
      </form>
    </div>
  );
}