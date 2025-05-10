import { useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import debounce from 'lodash/debounce';

interface UseInfiniteScrollOptions {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 0.5,
  rootMargin = '100px',
}: UseInfiniteScrollOptions) {
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
  });

  const loadingRef = useRef(isLoading);
  loadingRef.current = isLoading;

  const loadMore = useCallback(
    debounce(async () => {
      if (loadingRef.current || !hasMore) return;
      await onLoadMore();
    }, 300),
    [onLoadMore, hasMore]
  );

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isLoading, loadMore]);

  return { ref };
} 