"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Custom useDebounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Search parameters interface
export interface EquipmentSearchParams {
  query?: string;
  category?: string;
  subcategory?: string;
  lat?: number;
  lng?: number;
  maxDistance?: number;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'distance' | 'price_asc' | 'price_desc' | 'newest';
}

// Search result interface
export interface EquipmentSearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string | null;
  location: string;
  hourlyRate?: number | null;
  dailyRate?: number | null;
  weeklyRate?: number | null;
  securityDeposit?: number | null;
  isAvailable: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  images: string[];
  tags: string[];
  distance?: number;
  relevanceScore?: number;
}

// Search response interface
export interface EquipmentSearchResponse {
  results: EquipmentSearchResult[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Hook return type
export interface UseEquipmentSearchReturn {
  results: EquipmentSearchResult[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  search: (newParams: EquipmentSearchParams) => void;
  updateParams: (newParams: Partial<EquipmentSearchParams>) => void;
  searchParams: EquipmentSearchParams;
  resetSearch: () => void;
}

/**
 * Custom hook for equipment search
 * Manages search state, API calls, and URL parameters
 */
export function useEquipmentSearch(
  initialParams: EquipmentSearchParams = {},
  syncWithUrl: boolean = true
): UseEquipmentSearchReturn {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  
  // Parse URL search params on initial load if syncWithUrl is true
  const getInitialParams = (): EquipmentSearchParams => {
    if (!syncWithUrl || !urlSearchParams) return initialParams;
    
    const params: EquipmentSearchParams = { ...initialParams };
    
    // Get parameters from URL
    const query = urlSearchParams.get('query');
    const category = urlSearchParams.get('category');
    const subcategory = urlSearchParams.get('subcategory');
    const lat = urlSearchParams.get('lat');
    const lng = urlSearchParams.get('lng');
    const maxDistance = urlSearchParams.get('maxDistance');
    const priceMin = urlSearchParams.get('priceMin');
    const priceMax = urlSearchParams.get('priceMax');
    const page = urlSearchParams.get('page');
    const limit = urlSearchParams.get('limit');
    const sortBy = urlSearchParams.get('sortBy');
    
    // Set parameters if they exist in the URL
    if (query) params.query = query;
    if (category) params.category = category;
    if (subcategory) params.subcategory = subcategory;
    if (lat) params.lat = parseFloat(lat);
    if (lng) params.lng = parseFloat(lng);
    if (maxDistance) params.maxDistance = parseFloat(maxDistance);
    if (priceMin) params.priceMin = parseFloat(priceMin);
    if (priceMax) params.priceMax = parseFloat(priceMax);
    if (page) params.page = parseInt(page);
    if (limit) params.limit = parseInt(limit);
    if (sortBy) params.sortBy = sortBy as any;
    
    return params;
  };
  
  // Initialize state
  const [searchParams, setSearchParams] = useState<EquipmentSearchParams>(getInitialParams());
  const [results, setResults] = useState<EquipmentSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    pages: number;
  }>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  
  // Function to generate URL search params
  const generateUrlParams = (params: EquipmentSearchParams): URLSearchParams => {
    const urlParams = new URLSearchParams();
    
    if (params.query) urlParams.set('query', params.query);
    if (params.category) urlParams.set('category', params.category);
    if (params.subcategory) urlParams.set('subcategory', params.subcategory);
    if (params.lat) urlParams.set('lat', params.lat.toString());
    if (params.lng) urlParams.set('lng', params.lng.toString());
    if (params.maxDistance) urlParams.set('maxDistance', params.maxDistance.toString());
    if (params.priceMin) urlParams.set('priceMin', params.priceMin.toString());
    if (params.priceMax) urlParams.set('priceMax', params.priceMax.toString());
    if (params.page && params.page > 1) urlParams.set('page', params.page.toString());
    if (params.limit && params.limit !== 20) urlParams.set('limit', params.limit.toString());
    if (params.sortBy && params.sortBy !== 'relevance') urlParams.set('sortBy', params.sortBy);
    
    return urlParams;
  };
  
  // Debounce the search params
  const debouncedSearchParams = useDebounce(searchParams, 500);
  
  // Search function
  const performSearch = useCallback(async (params: EquipmentSearchParams) => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      
      // Construct URL with search params
      const urlParams = generateUrlParams(params);
      const response = await fetch(`/api/equipment?${urlParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update state with results (API returns 'equipment' instead of 'results')
      setResults(data.equipment || []);
      setPagination(data.pagination || {
        total: 0,
        page: 1,
        limit: 20,
        pages: 0
      });
      
      // Update URL if syncWithUrl is true
      if (syncWithUrl) {
        router.push(`${pathname}?${urlParams.toString()}`, { scroll: false });
      }
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router, pathname, syncWithUrl]);
  
  // Run search when debounced search params change
  useEffect(() => {
    // Always perform search, even with empty params to load initial results
    performSearch(debouncedSearchParams);
  }, [debouncedSearchParams, performSearch]);
  
  // Update search parameters
  const updateParams = useCallback((newParams: Partial<EquipmentSearchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams,
      // Reset to page 1 if search parameters other than page are changed
      ...(newParams.page === undefined && { page: 1 }),
    }));
  }, []);
  
  // Perform a new search with completely new parameters
  const search = useCallback((newParams: EquipmentSearchParams) => {
    setSearchParams(newParams);
  }, []);
  
  // Reset search to initial state
  const resetSearch = useCallback(() => {
    setSearchParams({});
    setResults([]);
    setPagination({
      total: 0,
      page: 1,
      limit: 20,
      pages: 0,
    });
    
    if (syncWithUrl) {
      router.push(pathname, { scroll: false });
    }
  }, [pathname, router, syncWithUrl]);
  
  // Update search when URL params change (if syncWithUrl is true)
  useEffect(() => {
    if (syncWithUrl) {
      const newParams = getInitialParams();
      if (JSON.stringify(newParams) !== JSON.stringify(searchParams)) {
        setSearchParams(newParams);
      }
    }
  }, [urlSearchParams, syncWithUrl]);
  
  return {
    results,
    isLoading,
    isError,
    error,
    pagination,
    search,
    updateParams,
    searchParams,
    resetSearch,
  };
} 