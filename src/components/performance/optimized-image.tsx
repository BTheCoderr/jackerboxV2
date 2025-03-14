'use client';

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage component with enhanced loading performance
 * - Implements blur-up loading effect
 * - Handles errors gracefully
 * - Optimizes image loading with proper sizing
 * - Uses WebP format when supported
 */
export const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes = '100vw',
  priority = false,
  className = '',
  objectFit = 'cover',
  quality = 80,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(!priority);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  
  // Generate a tiny blur placeholder if not provided
  const defaultBlurDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMWYxIi8+PC9zdmc+';
  
  // Process image URL to optimize for CDNs
  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }
    
    try {
      const url = new URL(src);
      
      // Handle Unsplash images
      if (url.hostname.includes('unsplash.com')) {
        // Add quality and format parameters for Unsplash
        url.searchParams.set('q', quality.toString());
        url.searchParams.set('auto', 'format');
        url.searchParams.set('fit', 'crop');
        
        if (width && height) {
          url.searchParams.set('w', width.toString());
          url.searchParams.set('h', height.toString());
        }
        
        setImageSrc(url.toString());
      }
      // Handle Cloudinary images
      else if (url.hostname.includes('cloudinary.com')) {
        // Add transformations for Cloudinary
        const parts = url.pathname.split('/upload/');
        if (parts.length === 2) {
          const transformations = `q_${quality},f_auto,c_${objectFit === 'contain' ? 'fit' : 'fill'}`;
          const newPath = `${parts[0]}/upload/${transformations}/${parts[1]}`;
          url.pathname = newPath;
          setImageSrc(url.toString());
        }
      }
    } catch (e) {
      // If URL parsing fails, use the original src
      console.error('Error processing image URL:', e);
    }
  }, [src, width, height, quality, objectFit]);
  
  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };
  
  // Handle image error
  const handleError = () => {
    setError(true);
    if (onError) onError();
  };
  
  // If there's an error, show fallback
  if (error) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-1/3 h-1/3 text-gray-400"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`} style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}>
      <Image
        src={imageSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        quality={quality}
        className={`transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'} ${objectFit ? `object-${objectFit}` : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        loading={priority ? 'eager' : 'lazy'}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <svg 
            className="w-10 h-10 text-gray-400" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage'; 