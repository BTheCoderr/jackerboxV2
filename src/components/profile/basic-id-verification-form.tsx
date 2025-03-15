"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Upload, X, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import Image from "next/image";

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
  const [showTips, setShowTips] = useState(true);
  const [verificationProgress, setVerificationProgress] = useState(0);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IdVerificationFormValues>({
    resolver: zodResolver(idVerificationSchema),
    defaultValues: {
      documentType: user.idDocumentType as "passport" | "driver_license" | "national_id" | undefined,
    },
  });
  
  const selectedDocumentType = watch("documentType");
  
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
    
    // Start progress animation
    setVerificationProgress(10);
    const progressInterval = setInterval(() => {
      setVerificationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    
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
        
        clearInterval(progressInterval);
        setVerificationProgress(100);
        
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
        clearInterval(progressInterval);
        setVerificationProgress(0);
        setError("Error reading file");
        setIsLoading(false);
      };
    } catch (error) {
      clearInterval(progressInterval);
      setVerificationProgress(0);
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
          <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
          <h3 className="text-lg font-medium text-green-800">ID Verified</h3>
        </div>
        <p className="text-sm text-green-700 mt-1">
          Your identity has been verified on {user.idVerificationDate ? new Date(user.idVerificationDate).toLocaleDateString() : 'N/A'}.
        </p>
        <p className="text-sm text-green-700 mt-2">
          Document type: <span className="font-medium capitalize">{user.idDocumentType?.replace('_', ' ') || 'ID Document'}</span>
        </p>
      </div>
    );
  }
  
  if (user.idVerificationStatus === "pending") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-medium text-yellow-800">Verification Pending</h3>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          Your ID verification is being processed. We'll notify you once it's complete.
        </p>
        <div className="mt-3 bg-yellow-100 p-3 rounded-md">
          <p className="text-sm text-yellow-800 font-medium">What happens next?</p>
          <ol className="list-decimal list-inside text-sm text-yellow-800 mt-1 space-y-1">
            <li>Our team will review your submitted document</li>
            <li>We'll verify the information matches your account details</li>
            <li>You'll receive an email notification with the result</li>
          </ol>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-medium mb-2">Verify Your Identity</h3>
      <p className="text-sm text-gray-600 mb-4">
        To ensure the safety of our community, we require identity verification before renting or listing equipment.
      </p>
      
      {showTips && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Tips for successful verification</h4>
              <ul className="list-disc list-inside text-sm text-blue-700 mt-1 space-y-1">
                <li>Use a well-lit environment to take the photo</li>
                <li>Ensure all text on the document is clearly visible</li>
                <li>Make sure the entire document is in the frame</li>
                <li>Remove any glare or shadows from the document</li>
              </ul>
              <button 
                onClick={() => setShowTips(false)} 
                className="text-xs text-blue-600 hover:text-blue-800 mt-2 underline"
              >
                Hide tips
              </button>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            <div className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
              <span>{success}</span>
            </div>
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
          
          {selectedDocumentType && (
            <div className="mt-2 text-sm text-gray-600">
              {selectedDocumentType === "passport" && (
                <p>Please upload a clear photo of your passport's information page.</p>
              )}
              {selectedDocumentType === "driver_license" && (
                <p>Please upload a clear photo of the front of your driver's license.</p>
              )}
              {selectedDocumentType === "national_id" && (
                <p>Please upload a clear photo of the front of your national ID card.</p>
              )}
            </div>
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
                aria-label="Remove image"
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
        
        {isLoading && (
          <div className="mt-4">
            <p className="text-sm text-gray-700 mb-1">Verifying your document...</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${verificationProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Verifying..." : "Submit for Verification"}
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>
            By submitting your ID, you agree to our{" "}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </form>
    </div>
  );
} 