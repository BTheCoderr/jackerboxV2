'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface LazyLoadProps {
  children: ReactNode;
  placeholder?: ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export function LazyLoad({
  children,
  placeholder = <div className="h-40 w-full bg-gray-100 animate-pulse rounded-md"></div>,
  threshold = 0.1,
  rootMargin = '200px',
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasLoaded, threshold, rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : placeholder}
    </div>
  );
} 