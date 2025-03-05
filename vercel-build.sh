#!/bin/bash

# Create UI components directory
mkdir -p src/components/ui

# Create utils.ts if it doesn't exist
mkdir -p src/lib
cat > src/lib/utils.ts << 'EOL'
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add formatDate function that was missing
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Add formatCurrency function
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
EOL

# Create button component
cat > src/components/ui/button.tsx << 'EOL'
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-100",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
EOL

# Create card component
cat > src/components/ui/card.tsx << 'EOL'
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-gray-200 bg-white shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
EOL

# Create alert component
cat > src/components/ui/alert.tsx << 'EOL'
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
      className
    )}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
EOL

# Create cloudinary-image component
cat > src/components/ui/cloudinary-image.tsx << 'EOL'
"use client";

import React from 'react';

interface CloudinaryImageProps {
  publicId: string;
  alt: string;
  width: number;
  height: number;
  effect?: string;
  transformations?: string;
  className?: string;
}

export function CloudinaryImage({
  publicId,
  alt,
  width,
  height,
  effect,
  transformations,
  className,
}: CloudinaryImageProps) {
  // Construct the Cloudinary URL
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgtqpyphg';
  
  let transformationString = '';
  if (effect) {
    transformationString += `e_${effect}/`;
  }
  if (transformations) {
    transformationString += `${transformations}/`;
  }
  
  const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}w_${width},h_${height},c_fill,q_auto,f_auto/${publicId}`;
  
  return (
    <img
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}

export function CloudinaryBlurImage({
  publicId,
  alt,
  width,
  height,
  className,
}: Omit<CloudinaryImageProps, 'effect' | 'transformations'>) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgtqpyphg';
  
  // Low quality placeholder
  const placeholderUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${height},c_fill,q_10,f_auto/${publicId}`;
  
  // Full quality image
  const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${publicId}`;
  
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  return (
    <div className="relative" style={{ width, height }}>
      {/* Placeholder image (blurred) */}
      <img
        src={placeholderUrl}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? 'opacity-0' : 'blur-sm'} transition-opacity duration-500 absolute inset-0`}
      />
      
      {/* Main image (loads in the background) */}
      <img
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
EOL

# Create cloudinary-upload component
cat > src/components/ui/cloudinary-upload.tsx << 'EOL'
"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface CloudinaryUploadProps {
  onUploadComplete: (files: any[]) => void;
  onUploadError: (error: Error) => void;
  folder?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export function CloudinaryUpload({
  onUploadComplete,
  onUploadError,
  folder = 'uploads',
  multiple = false,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ['image/*'],
  className = '',
  disabled = false,
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  const uploadToCloudinary = async (file: File) => {
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      
      // Call your API endpoint that handles the Cloudinary upload
      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };
  
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      
      setUploading(true);
      setUploadProgress({});
      
      try {
        // Initialize progress for each file
        const initialProgress: Record<string, number> = {};
        acceptedFiles.forEach((file) => {
          initialProgress[file.name] = 0;
        });
        setUploadProgress(initialProgress);
        
        // Upload each file and track progress
        const uploadPromises = acceptedFiles.map(async (file) => {
          // Simulate progress updates
          const updateInterval = setInterval(() => {
            setUploadProgress((prev) => {
              const current = prev[file.name] || 0;
              if (current < 90) {
                return { ...prev, [file.name]: current + 10 };
              }
              return prev;
            });
          }, 300);
          
          try {
            const result = await uploadToCloudinary(file);
            
            // Complete progress
            clearInterval(updateInterval);
            setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
            
            return {
              ...result,
              originalFilename: file.name,
            };
          } catch (error) {
            clearInterval(updateInterval);
            throw error;
          }
        });
        
        const results = await Promise.all(uploadPromises);
        onUploadComplete(results);
      } catch (error) {
        onUploadError(error instanceof Error ? error : new Error('Upload failed'));
      } finally {
        setUploading(false);
      }
    },
    [folder, onUploadComplete, onUploadError]
  );
  
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    multiple,
    disabled: disabled || uploading,
  });
  
  // Handle file rejections (e.g., file too large, wrong type)
  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <li key={file.name} className="text-red-500 text-sm mt-1">
      {file.name} - {errors.map((e) => e.message).join(', ')}
    </li>
  ));
  
  return (
    <div className={`w-full ${className}`}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive ? (
              <span className="text-blue-500">Drop the files here...</span>
            ) : (
              <span>
                Drag and drop {multiple ? 'files' : 'a file'}, or{' '}
                <span className="text-blue-500">browse</span>
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {acceptedFileTypes.join(', ')} (max {(maxSize / (1024 * 1024)).toFixed(0)}MB)
          </p>
        </div>
      </div>
      
      {fileRejectionItems.length > 0 && (
        <ul className="mt-2">{fileRejectionItems}</ul>
      )}
      
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Uploading...</p>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate max-w-[80%]">{fileName}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
EOL

echo "UI components created successfully!"

# Run the build
npm run build --no-lint 