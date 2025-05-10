'use client';

import { useState, useCallback } from 'react';
import { uploadImage, getImageUrl, deleteImage } from '@/lib/cloudinary';
import { toast } from 'sonner';

interface UploadedImage {
  publicId: string;
  url: string;
  originalUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

interface UploadProgress {
  [key: string]: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime'
];

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function CloudinaryUploader() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    setError(null);
    
    try {
      const validFiles = files.filter(file => {
        const error = validateFile(file);
        if (error) {
          toast.error(`${file.name}: ${error}`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        throw new Error('No valid files to upload');
      }

      const uploadPromises = validFiles.map(async (file) => {
        try {
          // Create a unique key for this upload
          const uploadKey = `${file.name}-${Date.now()}`;
          
          // Initialize progress for this file
          setUploadProgress(prev => ({
            ...prev,
            [uploadKey]: 0
          }));

          const result = await uploadImage(file);
          
          // Set progress to 100% when done
          setUploadProgress(prev => ({
            ...prev,
            [uploadKey]: 100
          }));

          return {
            publicId: result.public_id,
            url: getImageUrl(result.public_id, {
              width: 300,
              height: 300,
              crop: 'fill',
              quality: 'auto'
            }),
            originalUrl: result.secure_url,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          };
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((result): result is UploadedImage => result !== null);
      
      if (successfulUploads.length > 0) {
        setImages(prev => [...prev, ...successfulUploads]);
        toast.success(`Successfully uploaded ${successfulUploads.length} files`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
      toast.error('Upload failed');
    } finally {
      setUploadProgress({});
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    await handleFiles(files);
  };

  const handleDelete = async (publicId: string) => {
    try {
      await deleteImage(publicId);
      setImages(prev => prev.filter(img => img.publicId !== publicId));
      toast.success('Image deleted successfully');
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  const applyTransformation = (publicId: string, transformation: string) => {
    setImages(prev => prev.map(img => {
      if (img.publicId === publicId) {
        let transform = {};
        switch (transformation) {
          case 'grayscale':
            transform = { effect: 'grayscale' };
            break;
          case 'blur':
            transform = { effect: 'blur:1000' };
            break;
          case 'sepia':
            transform = { effect: 'sepia' };
            break;
          case 'art':
            transform = { effect: 'art:zorro' };
            break;
          case 'cartoonify':
            transform = { effect: 'cartoonify' };
            break;
          case 'vignette':
            transform = { effect: 'vignette:50' };
            break;
          case 'pixelate':
            transform = { effect: 'pixelate:8' };
            break;
          case 'oil_paint':
            transform = { effect: 'oil_paint:40' };
            break;
          default:
            transform = {};
        }
        return {
          ...img,
          url: getImageUrl(publicId, {
            ...transform,
            width: 300,
            height: 300,
            crop: 'fill',
            quality: 'auto'
          })
        };
      }
      return img;
    }));
  };

  const resetImage = (publicId: string) => {
    setImages(prev => prev.map(img => {
      if (img.publicId === publicId) {
        return {
          ...img,
          url: getImageUrl(publicId, {
            width: 300,
            height: 300,
            crop: 'fill',
            quality: 'auto'
          })
        };
      }
      return img;
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Enhanced Cloudinary Uploader</h2>

      {/* File Type Info */}
      <div className="mb-4 text-sm text-gray-600">
        Supported files: JPG, PNG, GIF, WEBP, MP4, MOV (max {formatFileSize(MAX_FILE_SIZE)})
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${error ? 'border-red-500 bg-red-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer text-blue-600 hover:text-blue-800"
        >
          Click to upload
        </label>
        <span className="text-gray-500"> or drag and drop files here</span>
        
        {error && (
          <div className="mt-2 text-red-600 text-sm">{error}</div>
        )}
      </div>

      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([key, progress]) => (
        <div key={key} className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>{key.split('-')[0]}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ))}

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <div key={image.publicId} className="border rounded-lg p-4">
            {image.fileType.startsWith('video/') ? (
              <video
                src={image.originalUrl}
                controls
                className="w-full h-48 object-cover rounded-lg mb-2"
              />
            ) : (
              <img
                src={image.url}
                alt={image.fileName}
                className="w-full h-48 object-cover rounded-lg mb-2"
              />
            )}
            
            {/* File Info */}
            <div className="text-sm text-gray-600 mb-2">
              <div className="truncate">{image.fileName}</div>
              <div>{formatFileSize(image.fileSize)}</div>
            </div>
            
            {/* Image Controls */}
            {!image.fileType.startsWith('video/') && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => applyTransformation(image.publicId, 'grayscale')}
                    className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Grayscale
                  </button>
                  <button
                    onClick={() => applyTransformation(image.publicId, 'sepia')}
                    className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Sepia
                  </button>
                  <button
                    onClick={() => applyTransformation(image.publicId, 'blur')}
                    className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Blur
                  </button>
                  <button
                    onClick={() => applyTransformation(image.publicId, 'art')}
                    className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Artistic
                  </button>
                  <button
                    onClick={() => applyTransformation(image.publicId, 'cartoonify')}
                    className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Cartoon
                  </button>
                  <button
                    onClick={() => applyTransformation(image.publicId, 'vignette')}
                    className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Vignette
                  </button>
                  <button
                    onClick={() => applyTransformation(image.publicId, 'pixelate')}
                    className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Pixelate
                  </button>
                  <button
                    onClick={() => applyTransformation(image.publicId, 'oil_paint')}
                    className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Oil Paint
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resetImage(image.publicId)}
                    className="flex-1 px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => handleDelete(image.publicId)}
                    className="flex-1 px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
            
            {/* Video Controls */}
            {image.fileType.startsWith('video/') && (
              <button
                onClick={() => handleDelete(image.publicId)}
                className="w-full px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 