'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // If no images, show placeholder
  if (images.length === 0) {
    return (
      <div className="mb-8">
        <div className="aspect-w-16 aspect-h-9 relative rounded-lg overflow-hidden">
          <Image
            src="/images/placeholder.svg"
            alt="No image available"
            fill
            className="object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="relative">
        {/* Main Image */}
        <div className="aspect-w-16 aspect-h-9 mb-4 relative rounded-lg overflow-hidden">
          <Image
            src={images[selectedImageIndex]}
            alt={`${title} - main view`}
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Image Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button 
              onClick={() => setSelectedImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => setSelectedImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        
        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded-md text-sm">
            {selectedImageIndex + 1} / {images.length}
          </div>
        )}
        
        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-2">
            {images.map((image, index) => (
              <div 
                key={index} 
                className={`aspect-w-1 aspect-h-1 cursor-pointer relative rounded-md overflow-hidden border-2 transition-all ${
                  selectedImageIndex === index ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <Image
                  src={image}
                  alt={`${title} - thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 