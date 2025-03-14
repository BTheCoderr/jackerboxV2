import { useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
  onVisible?: () => void;
  minHeight?: string | number;
}

/**
 * LazyComponent only renders its children when scrolled into view
 * Uses IntersectionObserver for better performance
 */
export function LazyComponent({
  children,
  fallback,
  rootMargin = '200px',
  threshold = 0.1,
  className,
  onVisible,
  minHeight = '100px',
}: LazyComponentProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [ref, isInView] = useIntersectionObserver<HTMLDivElement>({
    rootMargin,
    threshold,
    triggerOnce: true,
  });

  // Render the component when it comes into view
  useEffect(() => {
    if (isInView && !shouldRender) {
      setShouldRender(true);
      onVisible?.();
    }
  }, [isInView, shouldRender, onVisible]);

  return (
    <div 
      ref={ref} 
      className={cn('relative', className)}
      style={{ minHeight }}
    >
      {shouldRender ? children : fallback}
    </div>
  );
}

export default LazyComponent; 