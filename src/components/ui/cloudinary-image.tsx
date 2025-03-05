"use client";

import React from 'react';

interface CloudinaryImageProps {
  publicId: string;
  alt: string;
  width: number;
  height: number;
  effect?: string;
  transformations?: string;
  className?: string;
}

export function CloudinaryImage({
  publicId,
  alt,
  width,
  height,
  effect,
  transformations,
  className,
}: CloudinaryImageProps) {
  // Construct the Cloudinary URL
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgtqpyphg';
  
  let transformationString = '';
  if (effect) {
    transformationString += `e_${effect}/`;
  }
  if (transformations) {
    transformationString += `${transformations}/`;
  }
  
  const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}w_${width},h_${height},c_fill,q_auto,f_auto/${publicId}`;
  
  return (
    <img
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}

export function CloudinaryBlurImage({
  publicId,
  alt,
  width,
  height,
  className,
}: Omit<CloudinaryImageProps, 'effect' | 'transformations'>) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgtqpyphg';
  
  // Low quality placeholder
  const placeholderUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${height},c_fill,q_10,f_auto/${publicId}`;
  
  // Full quality image
  const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${publicId}`;
  
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  return (
    <div className="relative" style={{ width, height }}>
      {/* Placeholder image (blurred) */}
      <img
        src={placeholderUrl}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? 'opacity-0' : 'blur-sm'} transition-opacity duration-500 absolute inset-0`}
      />
      
      {/* Main image (loads in the background) */}
      <img
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
