import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useS3Upload } from '@/hooks/use-s3-upload';

interface FileUploadProps {
  onUploadComplete?: (files: { key: string; url: string; file: File }[]) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  folder?: string;
  className?: string;
  multiple?: boolean;
  disabled?: boolean;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
  },
  folder = 'uploads',
  className = '',
  multiple = false,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ key: string; url: string; file: File }[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  
  const { uploading, progress, error, upload } = useS3Upload();
  
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(rejection => {
        const error = rejection.errors[0];
        return `${rejection.file.name}: ${error.message}`;
      });
      setFileErrors(errors);
      return;
    }
    
    setFileErrors([]);
    
    // If not multiple, replace existing files
    const newFiles = multiple ? [...files, ...acceptedFiles] : acceptedFiles;
    setFiles(newFiles);
    
    try {
      const uploadPromises = acceptedFiles.map(file => 
        upload(file, { folder })
          .then(result => ({ ...result, file }))
      );
      
      const results = await Promise.all(uploadPromises);
      
      const newUploadedFiles = multiple 
        ? [...uploadedFiles, ...results]
        : results;
      
      setUploadedFiles(newUploadedFiles);
      onUploadComplete?.(newUploadedFiles);
    } catch (err) {
      const uploadError = err as Error;
      onUploadError?.(uploadError);
    }
  }, [files, upload, folder, multiple, uploadedFiles, onUploadComplete, onUploadError]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
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
    onUploadComplete?.(newUploadedFiles);
  };
  
  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Uploading... {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <>
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
            <p className="mt-2 text-sm text-gray-500">
              Drag and drop {multiple ? 'files' : 'a file'}, or click to select {multiple ? 'files' : 'a file'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {Object.entries(accept)
                .map(([type, exts]) => `${type.replace('/*', '')}: ${exts.join(', ')}`)
                .join(' | ')}
              {maxSize && ` (Max size: ${Math.round(maxSize / 1024 / 1024)}MB)`}
              {maxFiles > 1 && ` (Max files: ${maxFiles})`}
            </p>
          </>
        )}
      </div>
      
      {fileErrors.length > 0 && (
        <div className="mt-2">
          {fileErrors.map((error, index) => (
            <p key={index} className="text-sm text-red-500">{error}</p>
          ))}
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-500">
          Error: {error.message}
        </p>
      )}
      
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-gray-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm truncate max-w-xs">{file.name}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {file.size < 1024
                    ? `${file.size} B`
                    : file.size < 1024 * 1024
                    ? `${Math.round(file.size / 1024)} KB`
                    : `${Math.round(file.size / 1024 / 1024)} MB`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
                disabled={uploading}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 