import { useState, useCallback } from 'react';

interface UploadOptions {
  folder?: string;
  tags?: string[];
  transformation?: string;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  originalFilename: string;
}

interface UseCloudinaryUploadReturn {
  uploading: boolean;
  progress: number;
  error: Error | null;
  upload: (file: File, options?: UploadOptions) => Promise<UploadResult>;
}

/**
 * Custom hook for uploading files directly to Cloudinary
 */
export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(async (file: File, options: UploadOptions = {}): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Get a signature from the server
      const response = await fetch('/api/upload/cloudinary-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder: options.folder || 'uploads',
          tags: options.tags || [],
          transformation: options.transformation || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload signature');
      }

      const { signature, timestamp, apiKey, cloudName } = await response.json();

      // Create form data for the upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }
      
      if (options.transformation) {
        formData.append('transformation', options.transformation);
      }

      // Upload to Cloudinary with progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const currentProgress = Math.round((e.loaded / e.total) * 100);
            setProgress(currentProgress);
            options.onProgress?.(currentProgress);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result = JSON.parse(xhr.responseText);
            resolve({
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
              format: result.format,
              width: result.width,
              height: result.height,
              originalFilename: result.original_filename,
            });
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
          setUploading(false);
        };
        
        xhr.onerror = () => {
          const uploadError = new Error('Upload failed');
          setError(uploadError);
          reject(uploadError);
          setUploading(false);
        };
        
        xhr.send(formData);
      });
    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error('Unknown upload error');
      setError(uploadError);
      setUploading(false);
      throw uploadError;
    }
  }, []);

  return { uploading, progress, error, upload };
} 