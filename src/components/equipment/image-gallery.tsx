'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Process Unsplash URLs to ensure they work correctly
  const processImageUrl = (url: string): string => {
    if (!url) return '/images/placeholder.svg';
    
    // If it's an Unsplash URL, ensure it has the right parameters
    if (url.includes('unsplash.com')) {
      // Add direct access parameters for Unsplash
      const baseUrl = url.split('?')[0]; // Remove any existing parameters
      return `${baseUrl}?fit=crop&w=800&h=600&q=80&auto=format`;
    }
    
    return url;
  };

  // Generate a fallback image URL based on the equipment title
  const getFallbackImageUrl = (index: number) => {
    return '/images/placeholder.svg';
  };

  useEffect(() => {
    // Reset states when images prop changes
    setSelectedImageIndex(0);
    setIsLoading(true);
    
    // Use placeholder images if no images are provided
    if (!images || images.length === 0) {
      setLoadedImages(['/images/placeholder.svg']);
      setImageErrors(new Array(1).fill(false));
      setIsLoading(false);
      return;
    }
    
    // Process all image URLs
    const processedImages = images.map(processImageUrl);
    setLoadedImages(processedImages);
    setImageErrors(new Array(processedImages.length).fill(false));
    setIsLoading(false);
  }, [images]);

  // If no images or all images failed to load, show placeholder
  if ((!images || images.length === 0) && !isLoading) {
    return (
      <div className="mb-8">
        <div className="aspect-w-16 aspect-h-9 relative rounded-lg overflow-hidden bg-gray-100">
          <Image
            src="/images/placeholder.svg"
            alt="No image available"
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-contain"
            priority={false}
          />
        </div>
        <div className="mt-2 text-sm text-gray-500 text-center">
          No images available for this equipment
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="aspect-w-16 aspect-h-9 relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div className="mt-2 text-sm text-gray-500 text-center">
          Loading images...
        </div>
      </div>
    );
  }

  // Get the current image
  const currentImage = loadedImages[selectedImageIndex] || '/images/placeholder.svg';

  return (
    <div className="mb-8">
      <div className="relative">
        {/* Main Image */}
        <div className="aspect-w-16 aspect-h-9 mb-4 relative rounded-lg overflow-hidden bg-gray-100 h-[400px]">
          <Image
            src={currentImage}
            alt={`${title} - main view`}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-contain"
            priority={selectedImageIndex === 0}
            onError={() => {
              // Mark the image as having an error
              const newErrors = [...imageErrors];
              newErrors[selectedImageIndex] = true;
              setImageErrors(newErrors);
              
              // Try to find a non-error image
              const validIndex = loadedImages.findIndex((_, i) => !newErrors[i]);
              if (validIndex >= 0 && validIndex !== selectedImageIndex) {
                setSelectedImageIndex(validIndex);
              }
            }}
          />
        </div>
        
        {/* Image Navigation Arrows */}
        {loadedImages.length > 1 && (
          <>
            <button 
              onClick={() => {
                // Find the previous non-error image
                let prevIndex = selectedImageIndex;
                do {
                  prevIndex = prevIndex === 0 ? loadedImages.length - 1 : prevIndex - 1;
                } while (imageErrors[prevIndex] && prevIndex !== selectedImageIndex);
                
                setSelectedImageIndex(prevIndex);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md z-10"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => {
                // Find the next non-error image
                let nextIndex = selectedImageIndex;
                do {
                  nextIndex = nextIndex === loadedImages.length - 1 ? 0 : nextIndex + 1;
                } while (imageErrors[nextIndex] && nextIndex !== selectedImageIndex);
                
                setSelectedImageIndex(nextIndex);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md z-10"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        
        {/* Image Counter */}
        {loadedImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded-md text-sm z-10">
            {selectedImageIndex + 1} / {loadedImages.length}
          </div>
        )}
        
        {/* Thumbnail Gallery */}
        {loadedImages.length > 1 && (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-2">
            {loadedImages.map((image, index) => (
              !imageErrors[index] && (
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
                    sizes="100px"
                    className="object-cover"
                    loading="lazy"
                    onError={() => {
                      // Mark the image as having an error
                      const newErrors = [...imageErrors];
                      newErrors[index] = true;
                      setImageErrors(newErrors);
                    }}
                  />
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 