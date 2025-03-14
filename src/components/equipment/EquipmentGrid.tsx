'use client';

import { useState, useEffect } from 'react';
import { EquipmentCard } from './EquipmentCard';
import { Skeleton } from '@/components/ui/skeleton';
import LazyComponent from '@/components/ui/LazyComponent';

interface EquipmentGridProps {
  searchParams?: Record<string, string>;
}

export function EquipmentGrid({ searchParams = {} }: EquipmentGridProps) {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEquipment() {
      try {
        setLoading(true);
        setError(null);
        
        // Construct query string from searchParams
        const queryParams = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
        
        const response = await fetch(`/api/equipment?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch equipment');
        }
        
        const data = await response.json();
        setEquipment(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching equipment:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEquipment();
  }, [searchParams]);

  if (loading) {
    return <EquipmentGridSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-800">
        <p>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 rounded bg-red-100 px-4 py-2 text-red-800 hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <h3 className="mb-2 text-lg font-medium">No equipment found</h3>
        <p className="text-gray-500">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {equipment.map((item, index) => (
        <LazyComponent 
          key={item.id}
          fallback={<Skeleton className="aspect-[4/3] w-full rounded-lg" />}
          rootMargin="400px"
        >
          <EquipmentCard equipment={item} />
        </LazyComponent>
      ))}
    </div>
  );
}

function EquipmentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-4">
            <Skeleton className="mb-2 h-6 w-3/4" />
            <Skeleton className="mb-4 h-4 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default EquipmentGrid; 