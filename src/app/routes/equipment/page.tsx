'use client';

import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic imports for code splitting with lazy
const EquipmentSearch = lazy(() => import('@/components/search/EquipmentSearch'));
const EquipmentGrid = lazy(() => import('@/components/equipment/EquipmentGrid'));

// Skeleton loaders
function EquipmentSearchSkeleton() {
  return (
    <div className="space-y-4 mb-8">
      <Skeleton className="h-12 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    </div>
  );
}

function EquipmentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-1/4" />
        </div>
      ))}
    </div>
  );
}

interface EquipmentPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default function EquipmentPage({ searchParams }: EquipmentPageProps) {
  // Convert searchParams to the format expected by EquipmentGrid
  const simplifiedParams: Record<string, string> = {};
  
  // Extract only string values for the simplified params
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      simplifiedParams[key] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      simplifiedParams[key] = value[0];
    }
  });
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Equipment</h1>
      
      <Suspense fallback={<EquipmentSearchSkeleton />}>
        <EquipmentSearch defaultValues={searchParams} />
      </Suspense>
      
      <Suspense fallback={<EquipmentGridSkeleton />}>
        <EquipmentGrid searchParams={simplifiedParams} />
      </Suspense>
    </div>
  );
} 