"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Upload, X } from "lucide-react";

// Define the form schema
const idVerificationSchema = z.object({
  documentType: z.enum(["passport", "driver_license", "national_id"], {
    required_error: "Please select a document type",
  }),
});

type IdVerificationFormValues = z.infer<typeof idVerificationSchema>;

interface BasicIdVerificationFormProps {
  user: {
    id: string;
    idVerified?: boolean;
    idVerificationStatus?: string | null;
    idDocumentType?: string | null;
    idVerificationDate?: Date | null;
  };
}

export function BasicIdVerificationForm({ user }: BasicIdVerificationFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IdVerificationFormValues>({
    resolver: zodResolver(idVerificationSchema),
    defaultValues: {
      documentType: user.idDocumentType as "passport" | "driver_license" | "national_id" | undefined,
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }
    
    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setError(null);
  };
  
  const clearImage = () => {
    setPreviewImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const onSubmit = async (data: IdVerificationFormValues) => {
    if (!imageFile) {
      setError("Please upload an ID document");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      
      reader.onload = async () => {
        const base64Image = reader.result as string;
        
        const response = await fetch("/api/users/verify-id-basic", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idDocumentBase64: base64Image,
            documentType: data.documentType,
          }),
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || "Failed to verify ID");
        }
        
        if (responseData.needsManualReview) {
          setSuccess("Your ID has been submitted for manual review. We'll notify you once it's verified.");
        } else if (responseData.isValid) {
          setSuccess("Your ID has been verified successfully!");
        } else {
          setError(responseData.message || "ID verification failed. Please try again with a clearer image.");
        }
        
        router.refresh();
        setIsLoading(false);
      };
      
      reader.onerror = () => {
        setError("Error reading file");
        setIsLoading(false);
      };
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
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
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-medium mb-4">Verify Your Identity</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {success}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Type
          </label>
          <select
            {...register("documentType")}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="">Select document type</option>
            <option value="passport">Passport</option>
            <option value="driver_license">Driver's License</option>
            <option value="national_id">National ID Card</option>
          </select>
          {errors.documentType && (
            <p className="mt-1 text-sm text-red-600">{errors.documentType.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload ID Document
          </label>
          
          {previewImage ? (
            <div className="relative mt-2">
              <img
                src={previewImage}
                alt="ID Document Preview"
                className="max-w-full h-auto max-h-64 rounded-md"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-md p-6 mt-2 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, JPEG up to 5MB
              </p>
            </div>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isLoading}
          />
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !previewImage}
            className={`w-full py-2 px-4 rounded-md text-white ${
              isLoading || !previewImage
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Verifying..." : "Verify ID"}
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Note:</strong> We use automated verification to process your ID. Your document will be securely stored and only used for verification purposes.
          </p>
          <p className="mt-1">
            For faster verification, please ensure:
          </p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>The image is clear and not blurry</li>
            <li>All text on the document is readable</li>
            <li>The entire document is visible in the frame</li>
            <li>There is good lighting with no glare</li>
          </ul>
        </div>
      </form>
    </div>
  );
} 