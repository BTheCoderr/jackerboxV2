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
