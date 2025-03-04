import { useState, useCallback } from 'react';

interface UploadOptions {
  folder?: string;
  filename?: string;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  key: string;
  url: string;
}

interface UseS3UploadReturn {
  uploading: boolean;
  progress: number;
  error: Error | null;
  upload: (file: File, options?: UploadOptions) => Promise<UploadResult>;
}

export function useS3Upload(): UseS3UploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(async (
    file: File,
    { folder, filename, onProgress }: UploadOptions = {}
  ): Promise<UploadResult> => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Step 1: Get a pre-signed URL from our API
      const response = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: file.type,
          folder,
          filename,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get pre-signed URL');
      }

      const { presignedUrl, key, url } = await response.json();

      // Step 2: Upload the file directly to S3 using the pre-signed URL
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);

      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
          onProgress?.(percentComplete);
        }
      });

      // Create a promise to handle the XHR request
      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ key, url });
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => {
          reject(new Error('Network error occurred during upload'));
        };
        xhr.onabort = () => {
          reject(new Error('Upload aborted'));
        };
      });

      // Start the upload
      xhr.send(file);
      
      // Wait for the upload to complete
      const result = await uploadPromise;
      setProgress(100);
      return result;
    } catch (err) {
      const uploadError = err as Error;
      setError(uploadError);
      throw uploadError;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, progress, error, upload };
} 