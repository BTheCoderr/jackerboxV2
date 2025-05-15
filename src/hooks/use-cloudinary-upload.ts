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

  // Local file handling for development mode
  const handleLocalFile = async (file: File, options: UploadOptions = {}): Promise<UploadResult> => {
    // Simulate upload progress
    const simulateProgress = () => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress > 100) {
          clearInterval(interval);
          return;
        }
        setProgress(currentProgress);
        options.onProgress?.(currentProgress);
      }, 200);
      
      return () => clearInterval(interval);
    };
    
    const clearProgressSimulator = simulateProgress();
    
    // Read file to get dimensions (for images)
    let width = 800;
    let height = 600;
    
    if (file.type.startsWith('image/')) {
      try {
        const dimensions = await new Promise<{width: number, height: number}>((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({ width: img.width, height: img.height });
            URL.revokeObjectURL(img.src);
          };
          img.src = URL.createObjectURL(file);
        });
        
        width = dimensions.width;
        height = dimensions.height;
      } catch (e) {
        console.error('Error getting image dimensions:', e);
      }
    }
    
    // Use local fallback images based on the file type
    const getLocalImagePath = (file: File): string => {
      const fileType = file.type.split('/')[1]?.toLowerCase() || '';
      
      // Map of file extensions to local fallback images
      const typeToImage: Record<string, string> = {
        'jpeg': '/images/equipment/camera.jpg',
        'jpg': '/images/equipment/camera.jpg',
        'png': '/images/equipment/mixer.jpg',
        'gif': '/images/equipment/drone.jpg',
        'webp': '/images/equipment/drill.jpg',
        'default': '/images/equipment/guitar.jpg'
      };
      
      return typeToImage[fileType] || typeToImage.default;
    };
    
    // Wait a bit to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Clean up the progress simulator
    clearProgressSimulator();
    
    // Return simulated result
    const localUrl = getLocalImagePath(file);
    return {
      publicId: `local-${Date.now()}-${file.name.replace(/\s+/g, '-')}`,
      url: localUrl,
      secureUrl: localUrl,
      format: file.type.split('/')[1] || 'jpg',
      width,
      height,
      originalFilename: file.name,
    };
  };

  const upload = useCallback(async (file: File, options: UploadOptions = {}): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // In development mode, use local file handling
      if (process.env.NODE_ENV === 'development') {
        return await handleLocalFile(file, options);
      }
      
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