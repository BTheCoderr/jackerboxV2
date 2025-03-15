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
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchEquipment = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Build query string from searchParams
        const queryParams = new URLSearchParams();
        
        if (searchParams) {
          const query = searchParams.get('query');
          const category = searchParams.get('category');
          const location = searchParams.get('location');
          const minPrice = searchParams.get('minPrice');
          const maxPrice = searchParams.get('maxPrice');
          
          if (query) queryParams.append('query', query);
          if (category) queryParams.append('category', category);
          if (location) queryParams.append('location', location);
          if (minPrice) queryParams.append('minPrice', minPrice);
          if (maxPrice) queryParams.append('maxPrice', maxPrice);
        }
        
        const queryString = queryParams.toString();
        const url = `/api/equipment${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url, {
          next: { revalidate: 60 } // Revalidate every 60 seconds
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch equipment');
        }
        
        const data = await response.json();
        setEquipment(data);
      } catch (err) {
        console.error('Error fetching equipment:', err);
        setError('Failed to load equipment. Please try again later.');
      } finally {
        // Add a small delay to prevent layout shift when loading is very fast
        setTimeout(() => {
          setIsLoading(false);
        }, 100);
      }
    };
    
    fetchEquipment();
  }, [searchParams]);
  
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
  
  if (equipment.length === 0) {
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
          priority={index === 0} // Add priority loading for the first image
        />
      ))}
    </div>
  );
}

export function EquipmentGridSkeleton() {
  // Pre-render a fixed number of skeletons for better CLS
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3 rounded-lg border border-gray-200 overflow-hidden">
          <Skeleton className="h-48 w-full" /> {/* Image placeholder */}
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" /> {/* Title placeholder */}
            <Skeleton className="h-4 w-1/2" /> {/* Location placeholder */}
            <Skeleton className="h-5 w-1/3" /> {/* Price placeholder */}
          </div>
        </div>
      ))}
    </div>
  );
} 