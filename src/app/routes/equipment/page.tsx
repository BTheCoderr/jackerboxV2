// Add dynamic export to ensure proper data fetching
export const dynamic = 'force-dynamic';

import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import Link from "next/link";
import { EquipmentCard } from "@/components/equipment/equipment-card";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import { generateEnhancedSearchQuery } from "@/lib/search/search-utils";
import { EnhancedSearchForm } from "@/components/search/EnhancedSearchForm";

interface EquipmentPageProps {
  searchParams: {
    category?: string;
    location?: string;
    query?: string;
  };
}

export default async function EquipmentPage({ searchParams }: EquipmentPageProps) {
  const user = await getCurrentUser();
  
  // Extract search parameters safely for Next.js 15.2.0
  const params = await Promise.resolve(searchParams);
  const category = params.category || '';
  const location = params.location || '';
  const query = params.query || '';
  
  // Build the where clause for filtering
  let whereClause: any = {
    isAvailable: true,
  };
  
  if (category) {
    whereClause.category = category;
  }
  
  if (location) {
    whereClause.location = {
      contains: location,
      mode: "insensitive",
    };
  }
  
  if (query) {
    // Use enhanced search for better results
    const enhancedSearchQuery = generateEnhancedSearchQuery(query, ['title', 'description', 'tagsJson']);
    
    // Merge the enhanced search query with the existing where clause
    if (Object.keys(enhancedSearchQuery).length > 0) {
      if (enhancedSearchQuery.AND) {
        whereClause.AND = enhancedSearchQuery.AND;
      } else {
        Object.assign(whereClause, enhancedSearchQuery);
      }
    }
  }
  
  // Fetch equipment listings
  const equipment = await db.equipment.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-jacker-blue">Equipment for Rent</h1>
          <p className="text-gray-600">
            Find the perfect equipment for your next project
          </p>
        </div>
        
        {user && (
          <Link
            href="/routes/equipment/new"
            className="px-4 py-2 bg-jacker-orange text-white rounded-md hover:bg-opacity-90"
          >
            List Your Equipment
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="border rounded-lg p-4">
            <h2 className="font-medium mb-3 text-jacker-blue">Categories</h2>
            <div className="space-y-2">
              <Link
                href="/routes/equipment"
                className={`block text-sm ${
                  !category ? "font-medium text-jacker-blue" : "text-gray-600 hover:text-jacker-blue"
                }`}
              >
                All Categories
              </Link>
              {EQUIPMENT_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/routes/equipment?category=${encodeURIComponent(cat)}`}
                  className={`block text-sm ${
                    category === cat
                      ? "font-medium text-jacker-blue"
                      : "text-gray-600 hover:text-jacker-blue"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h2 className="font-medium mb-3 text-jacker-blue">Search</h2>
            <EnhancedSearchForm 
              defaultCategory={category}
              defaultQuery={query}
              defaultLocation={location}
            />
          </div>
        </div>
        
        {/* Equipment listings */}
        <div className="md:col-span-3">
          {equipment.length === 0 ? (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-gray-900">No equipment found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipment.map((item) => (
                <EquipmentCard key={item.id} equipment={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 