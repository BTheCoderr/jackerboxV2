"use client";

import { useState, useCallback, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EQUIPMENT_CATEGORIES } from '@/lib/constants';
import { FeatureToggle } from '@/components/feature-flags/FeatureToggle';
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
    params.set('priceMin', priceRange[0].toString());
    params.set('priceMax', priceRange[1].toString());
    params.append('sortBy', sortBy);
    
    onSearch(query, { category, location, priceMin: priceRange[0], priceMax: priceRange[1], sortBy });
    // Navigate to the equipment page with the search parameters
    router.push(`/routes/equipment?${params.toString()}`);
  }, [query, category, location, router, priceRange, sortBy, onSearch]);
  
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
        
        <div className="md:w-44">
          <label className="sr-only" htmlFor="search-category">Category</label>
          <select id="search-category" value={category} onChange={e => setCategory(e.target.value)}
            className="h-10 w-full rounded-md border bg-white px-2 text-sm">
            <option value="">All categories</option>
            {EQUIPMENT_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
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
      <label className="flex items-center gap-2 text-sm">
        Sort by
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="rounded-md border bg-white px-2 py-1">
          <option value="relevance">Newest or most relevant</option>
          <option value="price_asc">Lowest price</option>
          <option value="price_desc">Highest price</option>
          <option value="newest">Newest</option>
        </select>
      </label>
    </form>
  );
} 