import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import Link from "next/link";
import { EquipmentCard } from "@/components/equipment/equipment-card";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";

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
    };
  }
  
  if (query) {
    whereClause.OR = [
      {
        title: {
          contains: query,
        },
      },
      {
        description: {
          contains: query,
        },
      },
    ];
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
            <form action="/routes/equipment" method="GET">
              {category && (
                <input
                  type="hidden"
                  name="category"
                  value={category}
                />
              )}
              <div className="space-y-3">
                <div>
                  <label htmlFor="query" className="block text-sm mb-1">
                    Keyword
                  </label>
                  <input
                    id="query"
                    name="query"
                    type="text"
                    defaultValue={query}
                    placeholder="What are you looking for?"
                    className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-jacker-blue focus:border-jacker-blue"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm mb-1">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    defaultValue={location}
                    placeholder="City, State"
                    className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-jacker-blue focus:border-jacker-blue"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-jacker-blue text-white rounded-md hover:bg-opacity-90 text-sm"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Equipment listings */}
        <div className="md:col-span-3">
          {equipment.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-lg font-medium text-jacker-blue">No equipment found</h3>
              <p className="text-gray-500 mt-1">
                Try adjusting your search filters or browse all categories
              </p>
              <Link
                href="/routes/equipment"
                className="mt-4 inline-block px-4 py-2 bg-jacker-blue bg-opacity-10 text-jacker-blue rounded-md hover:bg-opacity-20"
              >
                View All Equipment
              </Link>
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