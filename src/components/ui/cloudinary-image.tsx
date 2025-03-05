"use client";

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  fill?: boolean;
  style?: React.CSSProperties;
}

const CloudinaryImage = ({
  src,
  alt,
  width = 800,
  height = 600,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  fill = false,
  style,
  ...props
}: CloudinaryImageProps & Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height'>) => {
  // Check if the src is already a Cloudinary URL
  const isCloudinaryUrl = src.includes('res.cloudinary.com');
  
  // If it's not a Cloudinary URL and we have a cloud name, construct the URL
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const imageUrl = isCloudinaryUrl 
    ? src 
    : cloudName 
      ? `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${src}` 
      : src;

  return (
    <div className={cn('relative', className)} style={style}>
      <Image
        src={imageUrl}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        priority={priority}
        sizes={sizes}
        quality={quality}
        fill={fill}
        className={cn('object-cover', className)}
        {...props}
      />
    </div>
  );
};

export { CloudinaryImage };
