import { Suspense } from 'react';
import { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import { EquipmentSearch } from '@/components/equipment/equipment-search';
import { EquipmentGrid } from '@/components/equipment/equipment-grid';
import { db } from '@/lib/db';
import { generateEnhancedSearchQuery, enhanceSearchResults } from '@/lib/search/search-utils';
import { EquipmentCard } from "@/components/equipment/EquipmentCard";

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

// Add configuration to make the page dynamic
export const dynamic = 'force-dynamic';

interface SearchParams {
  query?: string;
  category?: string;
  maxDistance?: string;
  minPrice?: string;
  maxPrice?: string;
  latitude?: string;
  longitude?: string;
  page?: string;
}

async function getEquipment(searchParams: SearchParams) {
  const page = Number(searchParams.page) || 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  // Build search query
  const searchOptions = {
    userLocation: searchParams.latitude && searchParams.longitude ? {
      latitude: Number(searchParams.latitude),
      longitude: Number(searchParams.longitude),
    } : undefined,
    maxDistance: searchParams.maxDistance ? Number(searchParams.maxDistance) : undefined,
    priceRange: {
      min: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      max: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    },
    categories: searchParams.category ? [searchParams.category] : undefined,
  };

  const query = generateEnhancedSearchQuery(
    searchParams.query || '',
    ['title', 'description', 'tagsjson'],
    searchOptions
  );

  // Get equipment with search conditions
  const equipment = await db.equipment.findMany({
    where: {
      isavailable: true,
    },
    select: {
      id: true,
      title: true,
      description: true,
      condition: true,
      category: true,
      subcategory: true,
      location: true,
      hourlyrate: true,
      dailyrate: true,
      weeklyrate: true,
      imagesjson: true,
      tagsjson: true,
      latitude: true,
      longitude: true,
      createdat: true,
      updatedat: true,
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    take: 12,
  });

  // Enhance results with distance if location provided
  const enhancedEquipment = searchOptions.userLocation
    ? enhanceSearchResults(equipment, searchParams.query || '', {
        userLocation: searchOptions.userLocation,
        searchFields: ['title', 'description', 'tagsjson'],
        sortByDistance: true,
      })
    : equipment;

  return {
    equipment: enhancedEquipment,
    pagination: {
      total: equipment.length,
      pages: Math.ceil(equipment.length / limit),
      current: page,
    },
  };
}

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { equipment, pagination } = await getEquipment(searchParams);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Equipment for Rent</h1>
      
      <Suspense fallback={<div>Loading search...</div>}>
        <EquipmentSearch
          onSearch={(params) => {
            // This will be handled client-side by the component
            console.log('Search params:', params);
          }}
        />
      </Suspense>
      
      <div className="mt-8">
        <Suspense fallback={<div>Loading equipment...</div>}>
          <EquipmentGrid
            equipment={equipment}
            pagination={pagination}
          />
        </Suspense>
      </div>
    </div>
  );
} 