import { Suspense } from 'react';
import { Metadata } from 'next';

// Fix the import to use named import
import { EquipmentGrid, EquipmentGridSkeleton } from '@/components/equipment';

// Import the client component wrapper for EquipmentSearch
import ClientEquipmentSearch from '@/components/search/ClientEquipmentSearch';

// Define skeleton loaders with exact dimensions to p// Define metadata for better SEO
export const metadata: Metadata = {
  title: 'Browse Equipment | Jackerbox',
  description: 'Find and rent equipment from people in your area. Browse our selection of tools, cameras, and more.',
};

// Add configuration to make the page dynamic
export const dynamic = 'force-dynamic';

// Define page props interface
interface EquipmentPageProps {
  searchParams?: {
    query?: string;
    category?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

export default async function EquipmentPage({ searchParams = {} }: EquipmentPageProps) {
  // Prepare search params for components
  const searchParamsObj = await Promise.resolve(searchParams);
  
  const searchValues = {
    query: searchParamsObj.query || '',
    category: searchParamsObj.category || '',
    location: searchParamsObj.location || '',
    minPrice: searchParamsObj.minPrice || '',
    maxPrice: searchParamsObj.maxPrice || ''
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Browse Equipment</h1>
      
      {/* Use the client wrapper component */}
      <ClientEquipmentSearch defaultValues={searchValues} />
      
      {/* Render equipment grid with suspense */}
      <div className="mt-8">
        <Suspense fallback={<EquipmentGridSkeleton />}>
          <EquipmentGrid />
        </Suspense>
      </div>
    </div>
  );
} 