"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { EQUIPMENT_CATEGORIES } from '@/lib/constants';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Filter, MapPin, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CSRFTokenInput, useCSRFToken } from "@/components/CSRFTokenProvider";

interface EquipmentSearchProps {
  onSearch: (params: SearchParams) => void;
}

interface SearchParams {
  query: string;
  category?: string;
  subcategory?: string;
  maxDistance?: number;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  endDate?: string;
  condition?: string[];
  features?: string[];
}

export function EquipmentSearch({ onSearch }: EquipmentSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { csrfToken } = useCSRFToken();
  
  const [searchState, setSearchState] = useState<SearchParams>({
    query: searchParams.get('query') || '',
    category: searchParams.get('category') || undefined,
    subcategory: searchParams.get('subcategory') || undefined,
    maxDistance: searchParams.get('maxDistance') ? Number(searchParams.get('maxDistance')) : 50,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    condition: searchParams.get('condition')?.split(',') || [],
    features: searchParams.get('features')?.split(',') || [],
  });
  
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: searchState.startDate ? new Date(searchState.startDate) : undefined,
    to: searchState.endDate ? new Date(searchState.endDate) : undefined,
  });
  
  // Equipment conditions and features for filtering
  const conditions = ['New', 'Like New', 'Good', 'Fair'];
  const features = ['Free Delivery', 'Insurance Included', 'Maintenance Included', 'Training Available'];
  
  useEffect(() => {
    // Try to get user's location from browser
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoadingLocation(false);
        }
      );
    }
  }, []);
  
  // Update date range when dates change in search state
  useEffect(() => {
    if (searchState.startDate || searchState.endDate) {
      setDateRange({
        from: searchState.startDate ? new Date(searchState.startDate) : undefined,
        to: searchState.endDate ? new Date(searchState.endDate) : undefined,
      });
    }
  }, [searchState.startDate, searchState.endDate]);
  
  // Update search state when date range changes
  useEffect(() => {
    if (dateRange.from || dateRange.to) {
      setSearchState(prev => ({
        ...prev,
        startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      }));
    }
  }, [dateRange]);
  
  const handleSearch = () => {
    const params = {
      ...searchState,
      ...(userLocation && {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      }),
    };
    
    onSearch(params);
    
    // Update URL with search params
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          queryParams.set(key, value.join(','));
        } else {
          queryParams.set(key, String(value));
        }
      }
    });
    
    router.push(`/routes/equipment?${queryParams.toString()}`);
  };
  
  const handleConditionChange = (condition: string, checked: boolean) => {
    setSearchState(prev => {
      const currentConditions = [...(prev.condition || [])];
      
      if (checked) {
        if (!currentConditions.includes(condition)) {
          currentConditions.push(condition);
        }
      } else {
        const index = currentConditions.indexOf(condition);
        if (index !== -1) {
          currentConditions.splice(index, 1);
        }
      }
      
      return {
        ...prev,
        condition: currentConditions,
      };
    });
  };
  
  const handleFeatureChange = (feature: string, checked: boolean) => {
    setSearchState(prev => {
      const currentFeatures = [...(prev.features || [])];
      
      if (checked) {
        if (!currentFeatures.includes(feature)) {
          currentFeatures.push(feature);
        }
      } else {
        const index = currentFeatures.indexOf(feature);
        if (index !== -1) {
          currentFeatures.splice(index, 1);
        }
      }
      
      return {
        ...prev,
        features: currentFeatures,
      };
    });
  };
  
  const clearFilters = () => {
    setSearchState({
      query: '',
      category: undefined,
      subcategory: undefined,
      maxDistance: 50,
      minPrice: undefined,
      maxPrice: undefined,
      startDate: undefined,
      endDate: undefined,
      condition: [],
      features: [],
    });
    setDateRange({ from: undefined, to: undefined });
  };
  
  // Get subcategories based on selected category
  const getSubcategories = (category: string | undefined) => {
    if (!category) return [];
    
    // This is a placeholder. In a real app, you would have a mapping of categories to subcategories
    const subcategoryMap: Record<string, string[]> = {
      'Construction Tools': ['Concrete', 'Demolition', 'Excavation', 'Scaffolding'],
      'Power Tools': ['Drills', 'Saws', 'Sanders', 'Grinders'],
      'Hand Tools': ['Wrenches', 'Hammers', 'Screwdrivers', 'Pliers'],
      'Gardening & Landscaping': ['Mowers', 'Trimmers', 'Tillers', 'Pruners'],
      'Photography & Video': ['Cameras', 'Lenses', 'Lighting', 'Stabilizers'],
      'Audio Equipment': ['Microphones', 'Speakers', 'Mixers', 'Amplifiers'],
    };
    
    return subcategoryMap[category] || [];
  };
  
  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow border border-gray-200">
      <CSRFTokenInput />
      <input type="hidden" name="_csrf" value={csrfToken} />
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search equipment..."
            value={searchState.query}
            onChange={(e) => setSearchState(prev => ({ ...prev, query: e.target.value }))}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="whitespace-nowrap"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          <Button onClick={handleSearch} disabled={isLoadingLocation} className="whitespace-nowrap">
            {isLoadingLocation ? 'Getting location...' : 'Search'}
          </Button>
        </div>
      </div>
      
      {/* Active filters */}
      {(searchState.category || searchState.condition?.length || searchState.features?.length || searchState.startDate) && (
        <div className="flex flex-wrap gap-2 pt-2">
          {searchState.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {searchState.category}
              <button onClick={() => setSearchState(prev => ({ ...prev, category: undefined }))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {searchState.subcategory && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {searchState.subcategory}
              <button onClick={() => setSearchState(prev => ({ ...prev, subcategory: undefined }))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {searchState.startDate && searchState.endDate && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {format(new Date(searchState.startDate), 'MMM d')} - {format(new Date(searchState.endDate), 'MMM d')}
              <button onClick={() => {
                setSearchState(prev => ({ ...prev, startDate: undefined, endDate: undefined }));
                setDateRange({ from: undefined, to: undefined });
              }}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {searchState.condition?.map(condition => (
            <Badge key={condition} variant="secondary" className="flex items-center gap-1">
              {condition}
              <button onClick={() => handleConditionChange(condition, false)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {searchState.features?.map(feature => (
            <Badge key={feature} variant="secondary" className="flex items-center gap-1">
              {feature}
              <button onClick={() => handleFeatureChange(feature, false)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear All
          </Button>
        </div>
      )}
      
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={searchState.category || ''}
              onChange={(e) => setSearchState(prev => ({ 
                ...prev, 
                category: e.target.value || undefined,
                subcategory: undefined // Reset subcategory when category changes
              }))}
              className="w-full rounded-md border border-gray-300 p-2"
            >
              <option value="">All Categories</option>
              {EQUIPMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          {searchState.category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <select
                value={searchState.subcategory || ''}
                onChange={(e) => setSearchState(prev => ({ ...prev, subcategory: e.target.value || undefined }))}
                className="w-full rounded-md border border-gray-300 p-2"
              >
                <option value="">All Subcategories</option>
                {getSubcategories(searchState.category).map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rental Period
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
                      </>
                    ) : (
                      format(dateRange.from, 'MMM d, yyyy')
                    )
                  ) : (
                    <span>Select dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Distance: {searchState.maxDistance} km
            </label>
            <div className="px-2">
              <Slider
                value={[searchState.maxDistance || 50]}
                onValueChange={(value) => setSearchState(prev => ({ ...prev, maxDistance: value[0] }))}
                min={1}
                max={100}
                step={1}
              />
            </div>
            {userLocation ? (
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <MapPin className="h-3 w-3 mr-1" /> Using your location
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Enable location for better results</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Range ($)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={searchState.minPrice || ''}
                onChange={(e) => setSearchState(prev => ({ ...prev, minPrice: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="Min"
                min={0}
              />
              <span className="flex items-center">-</span>
              <Input
                type="number"
                value={searchState.maxPrice || ''}
                onChange={(e) => setSearchState(prev => ({ ...prev, maxPrice: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="Max"
                min={0}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <div className="space-y-2">
              {conditions.map((condition) => (
                <div key={condition} className="flex items-center">
                  <Checkbox 
                    id={`condition-${condition}`} 
                    checked={searchState.condition?.includes(condition) || false}
                    onCheckedChange={(checked) => handleConditionChange(condition, checked as boolean)}
                  />
                  <label 
                    htmlFor={`condition-${condition}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {condition}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Features
            </label>
            <div className="space-y-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-center">
                  <Checkbox 
                    id={`feature-${feature}`} 
                    checked={searchState.features?.includes(feature) || false}
                    onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                  />
                  <label 
                    htmlFor={`feature-${feature}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {feature}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}