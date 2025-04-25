'use client';

import { useState } from 'react';
import { uploadImage, getImageUrl } from '@/lib/cloudinary';

export default function CloudinaryExample() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload the image to Cloudinary
      const result = await uploadImage(file);
      
      // Get the optimized URL for display
      const optimizedUrl = getImageUrl(result.public_id, {
        width: 300,
        height: 300,
        crop: 'fill',
        quality: 'auto'
      });
      
      setImageUrl(optimizedUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Cloudinary Image Upload Example</h2>
      
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {uploading && (
        <div className="text-blue-600">Uploading...</div>
      )}

      {imageUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Uploaded Image:</h3>
          <img
            src={imageUrl}
            alt="Uploaded"
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
} 