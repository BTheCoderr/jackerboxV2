"use client";

import { useState, useCallback, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchSuggestions } from './SearchSuggestions';
import { EQUIPMENT_CATEGORIES } from '@/lib/constants';
import { FeatureToggle } from '@/components/feature-flags/FeatureToggle';
import { FeatureFlags } from '@/lib/feature-flags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Search, MapPin, DollarSign } from 'lucide-react';
import { FEATURE_FLAGS } from '@/lib/statsig-config';

interface EnhancedSearchFormProps {
  className?: string;
  defaultCategory?: string;
  defaultQuery?: string;
  defaultLocation?: string;
  onSearch: (query: string, filters: any) => void;
}

export function EnhancedSearchForm({
  className = '',
  defaultCategory = '',
  defaultQuery = '',
  defaultLocation = '',
  onSearch,
}: EnhancedSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state with default values or URL params
  const [query, setQuery] = useState(defaultQuery || searchParams?.get('query') || '');
  const [category, setCategory] = useState(defaultCategory || searchParams?.get('category') || '');
  const [location, setLocation] = useState(defaultLocation || searchParams?.get('location') || '');
  
  // New state for enhanced search features
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState('relevance');
  
  // Handle form submission
  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    
    // Build the query string
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    
    // Add enhanced search parameters if the feature is enabled
    // These will be handled by the feature flag on the server
    params.append('minPrice', priceRange[0].toString());
    params.append('maxPrice', priceRange[1].toString());
    params.append('sortBy', sortBy);
    
    // Navigate to the equipment page with the search parameters
    router.push(`/routes/equipment?${params.toString()}`);
  }, [query, category, location, router, priceRange, sortBy]);
  
  // Handle suggestion selection for query
  const handleQuerySuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
  }, []);
  
  // Handle suggestion selection for location
  const handleLocationSuggestion = useCallback((suggestion: string) => {
    setLocation(suggestion);
  }, []);
  
  // Handle slider value change
  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };
  
  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search for equipment..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <FeatureToggle featureKey={FEATURE_FLAGS.ENHANCED_SEARCH}>
          <div className="flex-1">
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </FeatureToggle>
        
        <Button type="submit" className="md:w-auto">
          Search
        </Button>
      </div>
      
      <FeatureToggle featureKey={FEATURE_FLAGS.ENHANCED_SEARCH}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="price-range">Price Range</Label>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {priceRange[0]} - {priceRange[1]}
              </span>
            </div>
          </div>
          <Slider
            id="price-range"
            defaultValue={[0, 1000]}
            max={1000}
            step={10}
            value={priceRange}
            onValueChange={handlePriceRangeChange}
          />
        </div>
      </FeatureToggle>
    </form>
  );
} 