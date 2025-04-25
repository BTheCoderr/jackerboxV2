import { useEffect, useRef, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import debounce from 'lodash/debounce';

interface UseInfiniteScrollOptions<T> {
  fetchData: (page: number) => Promise<{
    data: T[];
    total: number;
  }>;
  initialData?: T[];
  pageSize?: number;
  threshold?: number;
  debounceMs?: number;
}

export function useInfiniteScroll<T>({
  fetchData,
  initialData = [],
  pageSize = 10,
  threshold = 0.5,
  debounceMs = 250,
}: UseInfiniteScrollOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const totalItems = useRef(0);

  // Use intersection observer to detect when the sentinel element is visible
  const { ref, inView } = useInView({
    threshold,
    rootMargin: '100px',
  });

  // Debounced fetch function to prevent multiple rapid requests
  const debouncedFetch = useCallback(
    debounce(async (pageNum: number) => {
      try {
        setLoading(true);
        setError(null);

        const { data: newData, total } = await fetchData(pageNum);
        totalItems.current = total;

        setData(prevData => {
          // Filter out duplicates based on ID
          const uniqueData = newData.filter(
            newItem => !prevData.some(
              existingItem => (existingItem as any).id === (newItem as any).id
            )
          );
          return [...prevData, ...uniqueData];
        });

        setHasMore(data.length + newData.length < total);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    }, debounceMs),
    [fetchData, debounceMs]
  );

  // Load more data when the sentinel becomes visible
  useEffect(() => {
    if (inView && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      debouncedFetch(nextPage);
    }
  }, [inView, loading, hasMore, page, debouncedFetch]);

  // Reset function for filtering or refreshing
  const reset = useCallback(async () => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);

    try {
      setLoading(true);
      const { data: newData, total } = await fetchData(1);
      totalItems.current = total;
      setData(newData);
      setHasMore(newData.length < total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (!loading) {
      reset();
    }
  }, [loading, reset]);

  return {
    data,
    loading,
    error,
    hasMore,
    refresh,
    sentinelRef: ref,
    totalItems: totalItems.current,
  };
} 