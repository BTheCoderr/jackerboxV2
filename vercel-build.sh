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
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CloudinaryImageProps {
  src?: string;
  publicId?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  fill?: boolean;
  style?: React.CSSProperties;
  effect?: string;
  transformations?: string;
}

interface CloudinaryBlurImageProps extends CloudinaryImageProps {
  blurDataURL?: string;
}

const CloudinaryImage = ({
  src,
  publicId,
  alt,
  width = 800,
  height = 600,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  fill = false,
  style,
  effect,
  transformations,
  ...props
}: CloudinaryImageProps & Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height'>) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  // Handle both src and publicId
  let imageUrl = src;
  if (publicId && cloudName) {
    let transformation = 'q_auto,f_auto';
    if (effect) transformation += `,e_${effect}`;
    if (transformations) transformation += `,${transformations}`;
    imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
  } else if (src && !src.includes('res.cloudinary.com') && cloudName) {
    imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${src}`;
  }

  if (!imageUrl && !publicId) {
    console.error('Either src or publicId must be provided to CloudinaryImage');
    return null;
  }

  return (
    <div className={cn('relative', className)} style={style}>
      <Image
        src={imageUrl || `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${publicId}`}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        priority={priority}
        sizes={sizes}
        quality={quality}
        fill={fill}
        className={cn('object-cover', className)}
        {...props}
      />
    </div>
  );
};

const CloudinaryBlurImage = ({
  src,
  publicId,
  alt,
  width = 800,
  height = 600,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  fill = false,
  style,
  blurDataURL,
  effect,
  transformations,
  ...props
}: CloudinaryBlurImageProps) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  // Handle both src and publicId
  let imageUrl = src;
  if (publicId && cloudName) {
    let transformation = 'q_auto,f_auto';
    if (effect) transformation += `,e_${effect}`;
    if (transformations) transformation += `,${transformations}`;
    imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
  } else if (src && !src.includes('res.cloudinary.com') && cloudName) {
    imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${src}`;
  }

  if (!imageUrl && !publicId) {
    console.error('Either src or publicId must be provided to CloudinaryBlurImage');
    return null;
  }

  // Generate blur URL if not provided
  const generatedBlurDataURL = blurDataURL || 
    (cloudName && (publicId || src)) 
      ? `https://res.cloudinary.com/${cloudName}/image/upload/w_10,e_blur:1000/${publicId || src}`
      : undefined;

  return (
    <div className={cn('relative', className)} style={style}>
      <Image
        src={imageUrl || `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${publicId}`}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        priority={priority}
        sizes={sizes}
        quality={quality}
        fill={fill}
        className={cn('object-cover', className)}
        placeholder="blur"
        blurDataURL={generatedBlurDataURL}
        {...props}
      />
    </div>
  );
};

export { CloudinaryImage, CloudinaryBlurImage };
EOL

# Create cloudinary-upload component
cat > src/components/ui/cloudinary-upload.tsx << 'EOL'
"use client";

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface CloudinaryUploadProps {
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: any) => void;
  buttonText?: string;
  uploadPreset?: string;
  className?: string;
  buttonClassName?: string;
  multiple?: boolean;
  maxFiles?: number;
  acceptedFileTypes?: string;
}

export function CloudinaryUpload({
  onUploadSuccess,
  onUploadError,
  buttonText = 'Upload Image',
  uploadPreset = 'jackerbox_uploads',
  className,
  buttonClassName,
  multiple = false,
  maxFiles = 10,
  acceptedFileTypes = 'image/*',
}: CloudinaryUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error('Cloudinary cloud name is not defined');
      }

      const uploads = acceptedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        return await response.json();
      });

      const results = await Promise.all(uploads);
      
      if (onUploadSuccess) {
        if (multiple) {
          onUploadSuccess(results);
        } else {
          onUploadSuccess(results[0]);
        }
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      if (onUploadError) {
        onUploadError(error);
      }
    }
  }, [onUploadSuccess, onUploadError, uploadPreset, multiple]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple,
    maxFiles
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors',
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <>
            <p className="mb-2">Drag & drop files here, or click to select</p>
            <button 
              type="button"
              className={cn(
                "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700",
                buttonClassName
              )}
            >
              {buttonText}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
EOL

echo "UI components created successfully!"

# Create dynamic export files for protected routes
mkdir -p src/app/routes/dashboard
echo "export const dynamic = 'force-dynamic';" > src/app/routes/dashboard/dynamic.js

mkdir -p src/app/routes/admin
echo "export const dynamic = 'force-dynamic';" > src/app/routes/admin/dynamic.js

mkdir -p src/app/routes/equipment/new
echo "export const dynamic = 'force-dynamic';" > src/app/routes/equipment/new/dynamic.js

mkdir -p src/app/routes/profile
echo "export const dynamic = 'force-dynamic';" > src/app/routes/profile/dynamic.js

mkdir -p src/app/routes/rentals
echo "export const dynamic = 'force-dynamic';" > src/app/routes/rentals/dynamic.js

mkdir -p src/app/routes/messages
echo "export const dynamic = 'force-dynamic';" > src/app/routes/messages/dynamic.js

echo "Dynamic exports created successfully!"

# Run the build
# Removing this line as it conflicts with the build:simple script in vercel.json
# npm run build --no-lint
