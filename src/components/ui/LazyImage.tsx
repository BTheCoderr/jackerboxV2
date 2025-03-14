import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { Skeleton } from './skeleton';

interface LazyImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  containerClassName?: string;
}

/**
 * LazyImage component that only loads when scrolled into view
 * Uses IntersectionObserver for better performance
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = '/images/placeholder.jpg',
  loadingComponent,
  errorComponent,
  rootMargin = '200px',
  threshold = 0.1,
  containerClassName,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [ref, isInView] = useIntersectionObserver<HTMLDivElement>({
    rootMargin,
    threshold,
    triggerOnce: true,
  });

  // Start loading the image when it comes into view
  useEffect(() => {
    if (isInView && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [isInView, shouldLoad]);

  // Handle image loading
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    setIsLoaded(true); // Consider it "loaded" even if it's an error
  };

  return (
    <div 
      ref={ref} 
      className={cn('relative overflow-hidden', containerClassName)}
      style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          {loadingComponent || <Skeleton className="w-full h-full" />}
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          {errorComponent || (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mb-2 text-gray-400"
              >
                <path d="M10 3H6a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-4" />
                <path d="M16 3h2a2 2 0 0 1 2 2v2" />
                <path d="M10 14H5" />
                <path d="M5 10h7" />
                <path d="M17 21v-6" />
                <path d="M14 18h6" />
              </svg>
              <p className="text-xs text-gray-500">Failed to load image</p>
            </div>
          )}
        </div>
      )}

      {shouldLoad && (
        <Image
          src={hasError ? fallbackSrc : src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
}

export default LazyImage; 