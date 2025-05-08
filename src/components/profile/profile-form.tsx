"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CSRFTokenInput, useCSRFToken } from "@/components/CSRFTokenProvider";
import { apiClient } from "@/lib/utils/api-client";
import Image from "next/image";

// Define the form schema with enhanced validation
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  image: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    bio?: string | null;
    phone?: string | null;
    phoneVerified?: boolean | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user.image || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { csrfToken } = useCSRFToken();
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
    watch,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      image: user.image || "",
      bio: user.bio || "",
      phone: user.phone || "",
    },
  });
  
  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiClient.put("/api/profile", data);
      toast.success("Profile updated successfully");
      router.refresh();
      router.push("/routes/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WebP)");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Image size must be less than 5MB");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'profile_images');
      
      // Create a local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      setValue('image', data.secure_url, { shouldDirty: true });
      toast.success("Image uploaded successfully");
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error("Failed to upload image");
      setImagePreview(user.image || null);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveImage = () => {
    setImagePreview(null);
    setValue('image', '', { shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <CSRFTokenInput />
        <input type="hidden" name="_csrf" value={csrfToken} />
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-black focus:border-black"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-black focus:border-black"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="flex">
            <input
              id="phone"
              type="tel"
              {...register("phone")}
              className="w-full p-2 border rounded-l-md focus:ring-2 focus:ring-black focus:border-black"
              placeholder="+1 (555) 123-4567"
            />
            {user.phoneVerified ? (
              <span className="inline-flex items-center px-3 bg-green-100 text-green-800 border border-l-0 border-green-300 rounded-r-md">
                Verified
              </span>
            ) : (
              <button
                type="button"
                className="px-3 bg-blue-100 text-blue-800 border border-l-0 border-blue-300 rounded-r-md hover:bg-blue-200"
                onClick={() => router.push("/routes/profile/verify-phone")}
              >
                Verify
              </button>
            )}
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            {...register("bio")}
            rows={4}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-black focus:border-black"
            placeholder="Tell us a bit about yourself..."
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {watch("bio")?.length || 0}/500 characters
          </p>
        </div>
        
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Profile Image
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden relative">
              {imagePreview ? (
                <Image 
                  src={imagePreview} 
                  alt={user.name || "User"} 
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xl font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <label
                htmlFor="image-upload"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200 text-center"
              >
                Upload New Image
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>
          <input
            id="image"
            type="hidden"
            {...register("image")}
          />
          <p className="mt-1 text-sm text-gray-500">
            Recommended: Square image, at least 200x200 pixels.
          </p>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/routes/profile")}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-opacity-80 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}