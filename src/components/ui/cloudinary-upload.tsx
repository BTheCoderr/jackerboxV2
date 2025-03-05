"use client";

import React, { useState, useCallback } from 'react';
import { Button } from './button';
import { CloudinaryImage } from './cloudinary-image';
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
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const handleUpload = useCallback(() => {
    if (!cloudName) {
      console.error('Cloudinary cloud name is not defined');
      if (onUploadError) onUploadError('Cloudinary cloud name is not defined');
      return;
    }

    // @ts-ignore - Cloudinary widget is loaded via script
    if (!window.cloudinary) {
      console.error('Cloudinary widget is not loaded');
      if (onUploadError) onUploadError('Cloudinary widget is not loaded');
      return;
    }

    setUploading(true);

    // @ts-ignore - Cloudinary widget is loaded via script
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        multiple,
        maxFiles,
        sources: ['local', 'url', 'camera'],
        resourceType: 'image',
        acceptedFileTypes: [acceptedFileTypes],
      },
      (error: any, result: any) => {
        setUploading(false);
        
        if (error) {
          console.error('Upload error:', error);
          if (onUploadError) onUploadError(error);
          return;
        }

        if (result.event === 'success') {
          const newImage = result.info.secure_url;
          setUploadedImages((prev) => [...prev, newImage]);
          
          if (onUploadSuccess) onUploadSuccess(result.info);
        }
      }
    );

    widget.open();
  }, [cloudName, uploadPreset, multiple, maxFiles, acceptedFileTypes, onUploadSuccess, onUploadError]);

  // Load Cloudinary widget script
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !window.document.getElementById('cloudinary-upload-widget')) {
      const script = document.createElement('script');
      script.id = 'cloudinary-upload-widget';
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Button 
        onClick={handleUpload} 
        disabled={uploading}
        className={buttonClassName}
      >
        {uploading ? 'Uploading...' : buttonText}
      </Button>
      
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {uploadedImages.map((image, index) => (
            <CloudinaryImage
              key={index}
              src={image}
              alt={`Uploaded image ${index + 1}`}
              width={300}
              height={200}
              className="rounded-md"
            />
          ))}
        </div>
      )}
    </div>
  );
}
