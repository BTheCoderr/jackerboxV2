"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';

interface ClientEquipmentSearchProps {
  defaultValues: {
    query: string;
    category: string;
    location: string;
    minPrice: string;
    maxPrice: string;
  };
}

export function ClientEquipmentSearch({ defaultValues }: ClientEquipmentSearchProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(defaultValues.query);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const current = new URLSearchParams(params ? Array.from(params.entries()) : []);
    
    if (searchQuery) {
      current.set('query', searchQuery);
    } else {
      current.delete('query');
    }
    
    const search = current.toString();
    const query = search ? `?${search}` : '';
    
    router.push(`/browse${query}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        <Button type="button" variant="outline" className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
        </Button>
        
        <Button type="submit">
          Search
        </Button>
      </div>
    </form>
  );
} 