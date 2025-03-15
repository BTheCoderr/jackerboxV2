'use client';

import { useState, useEffect } from 'react';
import { EquipmentCard } from './EquipmentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

interface Equipment {
  id: string;
  title: string;
  description: string;
  price: number;
  pricePerDay: number;
  location: string;
  images: string[];
  category: string;
  rating?: number;
  reviewCount?: number;
  distance?: number;
}

export function EquipmentGrid() {
  const searchParams = useSearchParams();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEquipment = async () => {
      setIsLoading(true);
      
      try {
        // Build query string from searchParams
        const params = new URLSearchParams();
        
        if (searchParams) {
          const query = searchParams.get('query');
          const category = searchParams.get('category');
          const location = searchParams.get('location');
          const minPrice = searchParams.get('minPrice');
          const maxPrice = searchParams.get('maxPrice');
          
          if (query) params.append('query', query);
          if (category) params.append('category', category);
          if (location) params.append('location', location);
          if (minPrice) params.append('minPrice', minPrice);
          if (maxPrice) params.append('maxPrice', maxPrice);
        }
        
        const queryString = params.toString();
        const url = `/api/equipment${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch equipment');
        }
        
        const data = await response.json();
        setEquipment(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching equipment:', err);
        setError('Failed to load equipment. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEquipment();
  }, [searchParams]);
  
  // Always render the skeleton during SSR to avoid hydration mismatch
  if (typeof window === 'undefined') {
    return <EquipmentGridSkeleton />;
  }
  
  if (isLoading) {
    return <EquipmentGridSkeleton />;
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!equipment || equipment.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-semibold mb-2">No equipment found</h3>
        <p className="text-gray-600">Try adjusting your search criteria.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {equipment.map((item, index) => (
        <EquipmentCard 
          key={item.id} 
          equipment={item} 
          priority={index < 4} // Prioritize the first 4 images for faster LCP
        />
      ))}
    </div>
  );
}

export function EquipmentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-lg border border-gray-200 overflow-hidden">
          <div className="h-48 w-full bg-gray-200" /> {/* Fixed height image placeholder */}
          <div className="p-4 space-y-3">
            <div className="h-6 w-3/4 bg-gray-200 rounded" /> {/* Title placeholder */}
            <div className="h-4 w-1/2 bg-gray-200 rounded" /> {/* Location placeholder */}
            <div className="h-5 w-1/3 bg-gray-200 rounded" /> {/* Price placeholder */}
          </div>
        </div>
      ))}
    </div>
  );
} 