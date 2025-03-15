import { Suspense } from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import components with loading states
const EquipmentSearch = dynamic(() => import('@/components/search/EquipmentSearch'), {
  loading: () => <EquipmentSearchSkeleton />,
  ssr: true
});

const EquipmentGrid = dynamic(() => import('@/components/equipment/EquipmentGrid').then(mod => ({ default: mod.EquipmentGrid })), {
  loading: () => <EquipmentGridSkeleton />,
  ssr: true
});

// Define skeleton loaders with exact dimensions to prevent layout shifts
function EquipmentSearchSkeleton() {
  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <Skeleton className="mb-4 h-8 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}

function EquipmentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3 rounded-lg border border-gray-200 overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
      ))}
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
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Browse Equipment</h1>
      
      {/* Use Suspense for better loading states */}
      <Suspense fallback={<EquipmentSearchSkeleton />}>
        <EquipmentSearch 
          defaultValues={{
            query: searchParams.query || '',
            category: searchParams.category || '',
            location: searchParams.location || '',
            minPrice: searchParams.minPrice || '',
            maxPrice: searchParams.maxPrice || ''
          }}
        />
      </Suspense>
      
      <div className="mt-8">
        <Suspense fallback={<EquipmentGridSkeleton />}>
          <EquipmentGrid />
        </Suspense>
      </div>
    </div>
  );
} 