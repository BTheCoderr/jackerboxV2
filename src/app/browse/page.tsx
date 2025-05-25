import { Suspense } from 'react';
import { EquipmentGrid } from '@/components/equipment/equipment-grid';
import { EquipmentGridSkeleton } from '@/components/equipment/equipment-grid-skeleton';
import { ClientEquipmentSearch } from '@/components/equipment/client-equipment-search';

interface BrowsePageProps {
  searchParams?: {
    query?: string;
    category?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

export default async function BrowsePage({ searchParams = {} }: BrowsePageProps) {
  const searchValues = {
    query: searchParams.query || '',
    category: searchParams.category || '',
    location: searchParams.location || '',
    minPrice: searchParams.minPrice || '',
    maxPrice: searchParams.maxPrice || ''
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Equipment</h1>
      <p className="text-lg text-gray-600 mb-8">Find the perfect equipment for your next project</p>
      
      <ClientEquipmentSearch defaultValues={searchValues} />
      
      <div className="mt-8">
        <Suspense fallback={<EquipmentGridSkeleton />}>
          <EquipmentGrid />
        </Suspense>
      </div>
    </div>
  );
} 