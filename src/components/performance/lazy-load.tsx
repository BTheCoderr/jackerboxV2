'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface LazyLoadProps {
  children: ReactNode;
  placeholder?: ReactNode;
  threshold?: number;
  rootMargin?: string;
}

/**
 * LazyLoad component that only renders children when they are visible in the viewport
 * - Uses IntersectionObserver API for better performance
 * - Shows a placeholder while content is loading
 * - Configurable threshold and root margin
 */
export function LazyLoad({
  children,
  placeholder = <div className="animate-pulse bg-gray-200 h-40 w-full rounded"></div>,
  threshold = 0.1,
  rootMargin = '200px 0px',
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip if already loaded or if IntersectionObserver is not available
    if (hasLoaded || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Update state when intersection status changes
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
          // Disconnect the observer once the element is visible
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Start observing the target element
    if (ref.current) {
      observer.observe(ref.current);
    }

    // Clean up the observer when the component unmounts
    return () => {
      observer.disconnect();
    };
  }, [hasLoaded, threshold, rootMargin]);

  // If we're on the server or if IntersectionObserver is not available, render children
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return <>{children}</>;
  }

  return (
    <div ref={ref} className="w-full">
      {isVisible ? children : placeholder}
    </div>
  );
} 