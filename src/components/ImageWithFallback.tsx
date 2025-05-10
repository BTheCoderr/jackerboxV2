import React, { useState } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  fallbackSrc?: string;
  blur?: boolean;
}

export default function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  fallbackSrc = '/images/placeholder.jpg',
  blur = true,
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '50px 0px',
  });

  // Generate blur data URL for placeholder
  const blurDataURL = blur
    ? `data:image/svg+xml;base64,${Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
           <filter id="b" color-interpolation-filters="sRGB">
             <feGaussianBlur stdDeviation="20" />
           </filter>
           <rect width="100%" height="100%" x="0" y="0" fill="#f0f0f0" filter="url(#b)" />
         </svg>`
      ).toString('base64')}`
    : undefined;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {(inView || priority) && (
        <Image
          src={error ? fallbackSrc : src}
          alt={alt}
          width={width}
          height={height}
          className={`object-cover transition-opacity duration-300 ${
            error ? 'opacity-60' : 'opacity-100'
          }`}
          quality={quality}
          priority={priority}
          onError={() => setError(true)}
          placeholder={blur ? 'blur' : 'empty'}
          blurDataURL={blurDataURL}
          sizes={`
            (max-width: 640px) 100vw,
            (max-width: 1024px) 50vw,
            33vw
          `}
        />
      )}
    </div>
  );
} 