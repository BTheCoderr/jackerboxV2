'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search, MapPin, DollarSign, SlidersHorizontal } from 'lucide-react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/lib/statsig-config';

// Equipment categories
const EQUIPMENT_CATEGORIES = [
  'Construction',
  'Landscaping',
  'Automotive',
  'Photography',
  'Audio/Visual',
  'Party/Event',
  'Camping/Outdoor',
  'Sports',
  'Tools',
  'Other'
];

interface EquipmentSearchProps {
  defaultValues?: Record<string, string | string[] | undefined>;
}

export default function EquipmentSearch({ defaultValues = {} }: EquipmentSearchProps) {
  const router = useRouter();
  const isEnhancedSearch = useFeatureFlag(FEATURE_FLAGS.ENHANCED_SEARCH);
  
  // Extract default values
  const defaultQuery = typeof defaultValues.query === 'string' ? defaultValues.query : '';
  const defaultCategory = typeof defaultValues.category === 'string' ? defaultValues.category : '';
  const defaultLocation = typeof defaultValues.location === 'string' ? defaultValues.location : '';
  const defaultMinPrice = typeof defaultValues.minPrice === 'string' ? parseInt(defaultValues.minPrice) : 0;
  const defaultMaxPrice = typeof defaultValues.maxPrice === 'string' ? parseInt(defaultValues.maxPrice) : 1000;
  
  // Form state
  const [query, setQuery] = useState(defaultQuery);
  const [category, setCategory] = useState(defaultCategory);
  const [location, setLocation] = useState(defaultLocation);
  const [priceRange, setPriceRange] = useState<[number, number]>([defaultMinPrice, defaultMaxPrice]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Handle price range change
  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build query params
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    if (isEnhancedSearch) {
      params.set('minPrice', priceRange[0].toString());
      params.set('maxPrice', priceRange[1].toString());
    }
    
    // Navigate to search results
    router.push(`/routes/equipment?${params.toString()}`);
  };
  
  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search for equipment..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {EQUIPMENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            type="button" 
            variant="outline" 
            className="md:w-auto"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button type="submit" className="md:w-auto">
            Search
          </Button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md mt-3">
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="location"
                  type="text"
                  placeholder="City, State"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {isEnhancedSearch && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="price-range">Price Range</Label>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {priceRange[0]} - {priceRange[1]}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <Slider
                    id="price-range"
                    defaultValue={[0, 1000]}
                    max={1000}
                    step={10}
                    value={priceRange}
                    onValueChange={handlePriceRangeChange}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
} 