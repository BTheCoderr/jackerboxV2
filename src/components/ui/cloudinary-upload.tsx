import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';
import { cn } from '@/lib/utils';

interface CloudinaryUploadProps {
  onUploadComplete?: (files: {
    publicId: string;
    url: string;
    secureUrl: string;
    format: string;
    width: number;
    height: number;
    originalFilename: string;
    file: File;
  }[]) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  folder?: string;
  tags?: string[];
  transformation?: string;
  className?: string;
  multiple?: boolean;
  disabled?: boolean;
}

export function CloudinaryUpload({
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    'application/pdf': ['.pdf'],
  },
  folder = 'uploads',
  tags = [],
  transformation = '',
  className = '',
  multiple = false,
  disabled = false,
}: CloudinaryUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  
  const { uploading, progress, error, upload } = useCloudinaryUpload();
  
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Reset errors
      setFileErrors([]);
      
      // Limit number of files
      const filesToUpload = acceptedFiles.slice(0, maxFiles);
      setFiles(filesToUpload);
      
      try {
        const uploadPromises = filesToUpload.map(async (file) => {
          try {
            const result = await upload(file, {
              folder,
              tags,
              transformation,
              onProgress: (progress) => {
                // You could track progress per file if needed
              },
            });
            
            return {
              ...result,
              file,
            };
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Upload failed');
            setFileErrors((prev) => [...prev, `${file.name}: ${error.message}`]);
            return null;
          }
        });
        
        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(Boolean) as any[];
        
        setUploadedFiles(successfulUploads);
        
        if (onUploadComplete && successfulUploads.length > 0) {
          onUploadComplete(successfulUploads);
        }
      } catch (err) {
        const uploadError = err instanceof Error ? err : new Error('Upload failed');
        setFileErrors((prev) => [...prev, uploadError.message]);
        if (onUploadError) {
          onUploadError(uploadError);
        }
      }
    },
    [upload, maxFiles, folder, tags, transformation, onUploadComplete, onUploadError]
  );
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
    multiple,
    disabled: disabled || uploading,
  });
  
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    const newUploadedFiles = [...uploadedFiles];
    newUploadedFiles.splice(index, 1);
    setUploadedFiles(newUploadedFiles);
  };
  
  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors',
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <input {...getInputProps()} />
        
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          <p className="mt-2 text-sm text-gray-600">
            Drag & drop {multiple ? 'files' : 'a file'} here, or click to select
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {Object.entries(accept)
              .map(([type, exts]) => exts.join(', '))
              .join(', ')}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Max size: {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>
      
      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Uploading: {progress}%</p>
        </div>
      )}
      
      {fileErrors.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-red-500">Errors:</p>
          <ul className="mt-1 text-sm text-red-500 list-disc list-inside">
            {fileErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700">Uploaded files:</p>
          <ul className="mt-2 divide-y divide-gray-200">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="py-2 flex items-center justify-between">
                <div className="flex items-center">
                  {file.format.match(/^(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={file.secureUrl}
                      alt={file.originalFilename}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">{file.format}</span>
                    </div>
                  )}
                  <span className="ml-2 text-sm text-gray-700 truncate max-w-xs">
                    {file.originalFilename}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 