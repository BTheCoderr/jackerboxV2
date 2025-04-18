'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Define skeleton loader for EquipmentSearch
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

// Dynamically import the EquipmentSearch component
// This is now valid since we're in a client component
const EquipmentSearch = dynamic(() => import('./EquipmentSearch'), {
  loading: () => <EquipmentSearchSkeleton />,
  ssr: false
});

// Define the props interface
interface ClientEquipmentSearchProps {
  defaultValues?: Record<string, string | string[] | undefined>;
}

// Export the client component wrapper
export default function ClientEquipmentSearch({ defaultValues }: ClientEquipmentSearchProps) {
  return (
    <Suspense fallback={<EquipmentSearchSkeleton />}>
      <EquipmentSearch defaultValues={defaultValues} />
    </Suspense>
  );
} 