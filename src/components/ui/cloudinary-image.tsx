"use client";

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CloudinaryImageProps {
  src?: string;
  publicId?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  fill?: boolean;
  style?: React.CSSProperties;
  effect?: string;
  transformations?: string;
}

interface CloudinaryBlurImageProps extends CloudinaryImageProps {
  blurDataURL?: string;
}

const CloudinaryImage = ({
  src,
  publicId,
  alt,
  width = 800,
  height = 600,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  fill = false,
  style,
  effect,
  transformations,
  ...props
}: CloudinaryImageProps & Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height'>) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  // Handle both src and publicId
  let imageUrl = src;
  if (publicId && cloudName) {
    let transformation = 'q_auto,f_auto';
    if (effect) transformation += `,e_${effect}`;
    if (transformations) transformation += `,${transformations}`;
    imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
  } else if (src && !src.includes('res.cloudinary.com') && cloudName) {
    imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${src}`;
  }

  if (!imageUrl && !publicId) {
    console.error('Either src or publicId must be provided to CloudinaryImage');
    return null;
  }

  return (
    <div className={cn('relative', className)} style={style}>
      <Image
        src={imageUrl || `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${publicId}`}
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

const CloudinaryBlurImage = ({
  src,
  publicId,
  alt,
  width = 800,
  height = 600,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  fill = false,
  style,
  blurDataURL,
  effect,
  transformations,
  ...props
}: CloudinaryBlurImageProps) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  // Handle both src and publicId
  let imageUrl = src;
  if (publicId && cloudName) {
    let transformation = 'q_auto,f_auto';
    if (effect) transformation += `,e_${effect}`;
    if (transformations) transformation += `,${transformations}`;
    imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
  } else if (src && !src.includes('res.cloudinary.com') && cloudName) {
    imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${src}`;
  }

  if (!imageUrl && !publicId) {
    console.error('Either src or publicId must be provided to CloudinaryBlurImage');
    return null;
  }

  // Generate blur URL if not provided
  const generatedBlurDataURL = blurDataURL || 
    (cloudName && (publicId || src)) 
      ? `https://res.cloudinary.com/${cloudName}/image/upload/w_10,e_blur:1000/${publicId || src}`
      : undefined;

  return (
    <div className={cn('relative', className)} style={style}>
      <Image
        src={imageUrl || `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${publicId}`}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        priority={priority}
        sizes={sizes}
        quality={quality}
        fill={fill}
        className={cn('object-cover', className)}
        placeholder="blur"
        blurDataURL={generatedBlurDataURL}
        {...props}
      />
    </div>
  );
};

export { CloudinaryImage, CloudinaryBlurImage };
