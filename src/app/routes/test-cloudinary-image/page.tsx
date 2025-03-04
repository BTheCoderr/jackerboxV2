'use client';

import { useState } from 'react';
import { CloudinaryImage, CloudinaryBlurImage } from '@/components/ui/cloudinary-image';

export default function TestCloudinaryImagePage() {
  const [publicId, setPublicId] = useState('');
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPublicId(inputValue);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test Cloudinary Image Display</h1>
      
      <div className="mb-8">
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter Cloudinary Public ID"
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Display
          </button>
        </form>
        
        <p className="text-sm text-gray-500 mb-4">
          After uploading an image with the Cloudinary Upload component, enter its public ID here to test different transformations.
        </p>
      </div>
      
      {publicId && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Standard Image</h2>
            <CloudinaryImage
              publicId={publicId}
              alt="Cloudinary test image"
              width={600}
              height={400}
              className="rounded-lg"
            />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Blur Image (Progressive Loading)</h2>
            <CloudinaryBlurImage
              publicId={publicId}
              alt="Cloudinary test image with blur effect"
              width={600}
              height={400}
              className="rounded-lg"
            />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Image Transformations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h3 className="font-medium mb-2">Grayscale</h3>
                <CloudinaryImage
                  publicId={publicId}
                  alt="Grayscale"
                  width={300}
                  height={200}
                  effect="grayscale"
                  className="rounded-lg"
                />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Sepia</h3>
                <CloudinaryImage
                  publicId={publicId}
                  alt="Sepia"
                  width={300}
                  height={200}
                  effect="sepia"
                  className="rounded-lg"
                />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Oil Paint</h3>
                <CloudinaryImage
                  publicId={publicId}
                  alt="Oil Paint"
                  width={300}
                  height={200}
                  effect="oil_paint"
                  className="rounded-lg"
                />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Pixelate</h3>
                <CloudinaryImage
                  publicId={publicId}
                  alt="Pixelate"
                  width={300}
                  height={200}
                  effect="pixelate:10"
                  className="rounded-lg"
                />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Blur</h3>
                <CloudinaryImage
                  publicId={publicId}
                  alt="Blur"
                  width={300}
                  height={200}
                  effect="blur:1000"
                  className="rounded-lg"
                />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Auto Color</h3>
                <CloudinaryImage
                  publicId={publicId}
                  alt="Auto Color"
                  width={300}
                  height={200}
                  transformations="e_improve"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 