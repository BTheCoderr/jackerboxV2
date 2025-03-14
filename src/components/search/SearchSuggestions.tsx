"use client";

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchSuggestionsProps {
  query: string;
  type?: 'equipment' | 'location' | 'category';
  onSelectSuggestion: (suggestion: string) => void;
  className?: string;
}

export function SearchSuggestions({
  query,
  type = 'equipment',
  onSelectSuggestion,
  className = '',
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fetch suggestions when the debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      
      setLoading(true);
      
      try {
        const response = await fetch(
          `/api/search/suggestions?query=${encodeURIComponent(debouncedQuery)}&type=${type}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setVisible(data.suggestions?.length > 0);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [debouncedQuery, type]);
  
  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Hide suggestions when query is empty
  useEffect(() => {
    if (!query) {
      setVisible(false);
    }
  }, [query]);
  
  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    setVisible(false);
  };
  
  if (!visible || suggestions.length === 0) {
    return null;
  }
  
  return (
    <div 
      ref={containerRef}
      className={`absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto ${className}`}
    >
      {loading ? (
        <div className="p-2 text-sm text-gray-500">Loading suggestions...</div>
      ) : (
        <ul className="py-1">
          {suggestions.map((suggestion, index) => (
            <li 
              key={index}
              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 