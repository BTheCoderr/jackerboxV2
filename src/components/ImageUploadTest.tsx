'use client';

import { useState } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinary';

export default function ImageUploadTest() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const result = await uploadToCloudinary(base64Data, {
            folder: 'test-uploads'
          });
          
          setUploadedUrl(result.secure_url);
        } catch (err) {
          console.error('Upload error:', err);
          setError('Failed to upload image');
        } finally {
          setUploading(false);
        }
      };
    } catch (err) {
      console.error('File reading error:', err);
      setError('Failed to read file');
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg max-w-md mx-auto mt-8">
      <h2 className="text-lg font-semibold mb-4">Test Image Upload</h2>
      
      <div className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
        
        {uploading && <p className="text-blue-600">Uploading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        
        {uploadedUrl && (
          <div className="mt-4">
            <p className="text-green-600 mb-2">Upload successful!</p>
            <img 
              src={uploadedUrl} 
              alt="Uploaded preview" 
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
} 