import { Suspense } from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import components with loading states
const EquipmentSearch = dynamic(() => import('@/components/search/EquipmentSearch'), {
  loading: () => <EquipmentSearchSkeleton />,
  ssr: true
});

// Import EquipmentGrid directly for better SSR
import { EquipmentGrid, EquipmentGridSkeleton } from '@/components/equipment/EquipmentGrid';

// Define skeleton loaders with exact dimensions to prevent layout shifts
function EquipmentSearchSkeleton() {
  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 h-8 w-48 bg-gray-200 rounded"></div>
      <div className="space-y-4">
        <div className="h-10 w-full bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-10 w-full bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Define metadata for better SEO
export const metadata: Metadata = {
  title: 'Browse Equipment | Jackerbox',
  description: 'Find and rent equipment from people in your area. Browse our selection of tools, cameras, and more.',
};

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

export default function EquipmentPage({ searchParams = {} }: EquipmentPageProps) {
  // Prepare search params for components
  const searchValues = {
    query: searchParams.query || '',
    category: searchParams.category || '',
    location: searchParams.location || '',
    minPrice: searchParams.minPrice || '',
    maxPrice: searchParams.maxPrice || ''
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Browse Equipment</h1>
      
      {/* Use Suspense for better loading states */}
      <Suspense fallback={<EquipmentSearchSkeleton />}>
        <EquipmentSearch defaultValues={searchValues} />
      </Suspense>
      
      {/* Render equipment grid with suspense */}
      <div className="mt-8">
        <Suspense fallback={<EquipmentGridSkeleton />}>
          <EquipmentGrid />
        </Suspense>
      </div>
    </div>
  );
} 