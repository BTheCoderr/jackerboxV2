"use client";

import { useState, useCallback, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchSuggestions } from './SearchSuggestions';
import { EQUIPMENT_CATEGORIES } from '@/lib/constants';

interface EnhancedSearchFormProps {
  className?: string;
  defaultCategory?: string;
  defaultQuery?: string;
  defaultLocation?: string;
}

export function EnhancedSearchForm({
  className = '',
  defaultCategory = '',
  defaultQuery = '',
  defaultLocation = '',
}: EnhancedSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state with default values or URL params
  const [query, setQuery] = useState(defaultQuery || searchParams?.get('query') || '');
  const [category, setCategory] = useState(defaultCategory || searchParams?.get('category') || '');
  const [location, setLocation] = useState(defaultLocation || searchParams?.get('location') || '');
  
  // Handle form submission
  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    
    // Build the query string
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    
    // Navigate to the equipment page with the search parameters
    router.push(`/routes/equipment?${params.toString()}`);
  }, [query, category, location, router]);
  
  // Handle suggestion selection for query
  const handleQuerySuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
  }, []);
  
  // Handle suggestion selection for location
  const handleLocationSuggestion = useCallback((suggestion: string) => {
    setLocation(suggestion);
  }, []);
  
  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="query" className="block text-sm mb-1 font-medium">
            What are you looking for?
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for equipment..."
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-jacker-blue focus:border-jacker-blue"
          />
          <SearchSuggestions
            query={query}
            type="equipment"
            onSelectSuggestion={handleQuerySuggestion}
          />
        </div>
        
        <div className="relative">
          <label htmlFor="location" className="block text-sm mb-1 font-medium">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-jacker-blue focus:border-jacker-blue"
          />
          <SearchSuggestions
            query={location}
            type="location"
            onSelectSuggestion={handleLocationSuggestion}
          />
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm mb-1 font-medium">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-jacker-blue focus:border-jacker-blue"
          >
            <option value="">All Categories</option>
            {EQUIPMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          className="w-full py-2 bg-jacker-blue text-white rounded-md hover:bg-opacity-90"
        >
          Search
        </button>
      </div>
    </form>
  );
} 