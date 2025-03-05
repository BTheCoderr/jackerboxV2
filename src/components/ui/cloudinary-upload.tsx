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
