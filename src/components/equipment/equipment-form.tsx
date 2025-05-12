"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Equipment } from "@prisma/client";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_CONDITIONS } from "@/lib/constants";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";

// Minimum number of required images
const MIN_REQUIRED_IMAGES = 5;

const equipmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  condition: z.enum(EQUIPMENT_CONDITIONS as [string, ...string[]]),
  category: z.enum(EQUIPMENT_CATEGORIES as [string, ...string[]]),
  subcategory: z.string().optional(),
  location: z.string().min(3, "Location is required"),
  hourlyRate: z.coerce.number().min(0).optional(),
  dailyRate: z.coerce.number().min(0).optional(),
  weeklyRate: z.coerce.number().min(0).optional(),
  securityDeposit: z.coerce.number().min(0).optional(),
}).refine(
  (data) => data.hourlyRate || data.dailyRate || data.weeklyRate,
  {
    message: "At least one rate (hourly, daily, or weekly) is required",
    path: ["hourlyRate"],
  }
);

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  initialData?: Equipment | null;
  isEditing?: boolean;
}

export function EquipmentForm({
  initialData,
  isEditing = false,
}: EquipmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(
    initialData?.imagesJson ? JSON.parse(initialData.imagesJson) : []
  );
  const [verificationStatus, setVerificationStatus] = useState<{
    inProgress: boolean;
    results: any[] | null;
    message: string | null;
  }>({
    inProgress: false,
    results: null,
    message: null,
  });
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const { upload } = useCloudinaryUpload();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue: _setValue,
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          condition: initialData.condition as any,
          category: initialData.category as any,
          subcategory: initialData.subcategory || undefined,
          location: initialData.location,
          hourlyRate: initialData.hourlyRate || undefined,
          dailyRate: initialData.dailyRate || undefined,
          weeklyRate: initialData.weeklyRate || undefined,
          securityDeposit: initialData.securityDeposit || undefined,
        }
      : {
          title: "",
          description: "",
          condition: "Good",
          category: "Other",
          subcategory: "",
          location: "",
          hourlyRate: undefined,
          dailyRate: undefined,
          weeklyRate: undefined,
          securityDeposit: undefined,
        },
  });

  const verifyImages = async (imageUrls: string[]) => {
    if (imageUrls.length === 0) return;
    
    setVerificationStatus({
      inProgress: true,
      results: null,
      message: "Verifying images...",
    });
    
    try {
      const response = await fetch("/api/equipment/verify-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images: imageUrls }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to verify images");
      }
      
      const data = await response.json();
      
      setVerificationStatus({
        inProgress: false,
        results: data.results,
        message: data.allValid 
          ? "All images verified successfully!" 
          : `${data.validCount} of ${imageUrls.length} images passed verification.`,
      });
      
      return data;
    } catch (error) {
      setVerificationStatus({
        inProgress: false,
        results: null,
        message: "Failed to verify images. You can still submit, but your listing may require manual review.",
      });
      console.error("Image verification error:", error);
      return null;
    }
  };

  const onSubmit = async (data: EquipmentFormValues) => {
    setIsLoading(true);
    setError(null);

    // Check if there are enough images
    if (images.length < MIN_REQUIRED_IMAGES) {
      setError(`Please upload at least ${MIN_REQUIRED_IMAGES} images of your equipment. Clear photos help renters make informed decisions.`);
      setIsLoading(false);
      return;
    }

    // Verify images if not already verified
    if (!verificationStatus.results) {
      const verificationResult = await verifyImages(images);
      
      // If verification failed completely, we'll still allow submission but warn the user
      if (verificationResult && !verificationResult.allValid) {
        // If less than half of the images are valid, show an error
        if (verificationResult.validCount < images.length / 2) {
          setError(`Several of your images don't meet our quality standards. Please review the verification results and upload better images.`);
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      // Convert tags from string to array
      const tags = data.subcategory
        ? data.subcategory.split(",").map((tag) => tag.trim())
        : [];

      const formData = {
        ...data,
        tagsJson: JSON.stringify(tags),
        imagesJson: JSON.stringify(images),
      };

      const url = isEditing
        ? `/api/equipment/${initialData?.id}`
        : "/api/equipment";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save equipment");
      }

      router.push("/routes/equipment");
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    setIsLoading(true);
    
    try {
      // Initialize progress tracking for each file
      setUploadProgress(new Array(newFiles.length).fill(0));
      
      // Upload each file to Cloudinary
      const uploadPromises = newFiles.map(async (file, index) => {
        try {
          // Upload to Cloudinary with progress tracking
          const result = await upload(file, {
            folder: "equipment",
            onProgress: (progress) => {
              setUploadProgress(prev => {
                const newProgress = [...prev];
                newProgress[index] = progress;
                return newProgress;
              });
            }
          });
          
          return result.secureUrl;
        } catch (error) {
          console.error(`Error uploading image ${index}:`, error);
          // Return a placeholder image on error
          return `https://source.unsplash.com/random/800x600?equipment,${index}`;
        }
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Add the new images to the existing ones
      setImages(prev => [...prev, ...uploadedUrls]);
      setVerificationStatus({
        inProgress: false,
        results: null,
        message: "Images uploaded. Click 'Verify Images' to check quality.",
      });
    } catch (error) {
      console.error("Image upload error:", error);
      setError("Failed to upload images. Please try again.");
    } finally {
      setIsLoading(false);
      // Reset the file input
      if (e.target.value) e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-1">
          <label htmlFor="title" className="text-sm font-medium">
            Title *
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
            placeholder="e.g. Professional DSLR Camera Kit"
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium">
            Description *
          </label>
          <textarea
            id="description"
            {...register("description")}
            className="w-full p-2 border rounded-md h-32"
            disabled={isLoading}
            placeholder="Describe your equipment in detail, including brand, model, features, and any usage instructions."
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="category" className="text-sm font-medium">
              Category *
            </label>
            <select
              id="category"
              {...register("category")}
              className="w-full p-2 border rounded-md"
              disabled={isLoading}
            >
              {EQUIPMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="subcategory" className="text-sm font-medium">
              Tags (comma separated)
            </label>
            <input
              id="subcategory"
              type="text"
              {...register("subcategory")}
              className="w-full p-2 border rounded-md"
              disabled={isLoading}
              placeholder="e.g. Canon, DSLR, 4K, Professional"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="condition" className="text-sm font-medium">
              Condition *
            </label>
            <select
              id="condition"
              {...register("condition")}
              className="w-full p-2 border rounded-md"
              disabled={isLoading}
            >
              {EQUIPMENT_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
            {errors.condition && (
              <p className="text-red-500 text-xs mt-1">
                {errors.condition.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="location" className="text-sm font-medium">
              Location *
            </label>
            <input
              id="location"
              type="text"
              {...register("location")}
              className="w-full p-2 border rounded-md"
              disabled={isLoading}
              placeholder="e.g. San Francisco, CA"
            />
            {errors.location && (
              <p className="text-red-500 text-xs mt-1">
                {errors.location.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="hourlyRate" className="text-sm font-medium">
              Hourly Rate ($)
            </label>
            <input
              id="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              {...register("hourlyRate")}
              className="w-full p-2 border rounded-md"
              disabled={isLoading}
              placeholder="e.g. 15.00"
            />
            {errors.hourlyRate && (
              <p className="text-red-500 text-xs mt-1">
                {errors.hourlyRate.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="dailyRate" className="text-sm font-medium">
              Daily Rate ($)
            </label>
            <input
              id="dailyRate"
              type="number"
              step="0.01"
              min="0"
              {...register("dailyRate")}
              className="w-full p-2 border rounded-md"
              disabled={isLoading}
              placeholder="e.g. 75.00"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="weeklyRate" className="text-sm font-medium">
              Weekly Rate ($)
            </label>
            <input
              id="weeklyRate"
              type="number"
              step="0.01"
              min="0"
              {...register("weeklyRate")}
              className="w-full p-2 border rounded-md"
              disabled={isLoading}
              placeholder="e.g. 350.00"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="securityDeposit" className="text-sm font-medium">
            Security Deposit ($)
          </label>
          <input
            id="securityDeposit"
            type="number"
            step="0.01"
            min="0"
            {...register("securityDeposit")}
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
            placeholder="e.g. 200.00"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Images <span className="text-red-500">*</span> 
            <span className="text-sm text-gray-500 ml-1">
              (Minimum {MIN_REQUIRED_IMAGES} required)
            </span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map((image, index) => (
              <div key={index} className="relative w-24 h-24">
                <img
                  src={image}
                  alt={`Equipment ${index + 1}`}
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            
            {uploadProgress.map((progress, index) => (
              progress < 100 && (
                <div key={`progress-${index}`} className="relative w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center">
                  <div className="absolute inset-2">
                    <div 
                      className="bg-jacker-blue h-full rounded-md opacity-50"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs z-10">{progress}%</span>
                </div>
              )
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Upload clear images of your equipment from multiple angles.
            </p>
            <p className={`text-xs ${images.length >= MIN_REQUIRED_IMAGES ? 'text-green-500' : 'text-amber-500'} font-medium`}>
              {images.length} / {MIN_REQUIRED_IMAGES} photos
            </p>
          </div>
          
          {images.length >= MIN_REQUIRED_IMAGES && !verificationStatus.results && !verificationStatus.inProgress && (
            <button
              type="button"
              onClick={() => verifyImages(images)}
              className="mt-2 text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100"
            >
              Verify Images
            </button>
          )}
          
          {verificationStatus.message && (
            <div className={`text-sm p-2 rounded-md ${
              verificationStatus.inProgress 
                ? 'bg-blue-50 text-blue-600' 
                : verificationStatus.results && verificationStatus.results.every(r => r.isValid)
                  ? 'bg-green-50 text-green-600'
                  : 'bg-amber-50 text-amber-600'
            }`}>
              {verificationStatus.message}
            </div>
          )}
          
          {verificationStatus.results && verificationStatus.results.some(r => !r.isValid) && (
            <div className="text-xs text-red-600 mt-1">
              Some images don't meet our quality standards. Consider replacing them for faster approval.
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          disabled={isLoading}
        >
          {isLoading
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
            ? "Update Equipment"
            : "List Equipment"}
        </button>
      </div>
    </form>
  );
} 