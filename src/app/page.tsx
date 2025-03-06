import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";

export default async function HomePage() {
  const user = await getCurrentUser();
  
  // Fetch featured equipment (most recent 6 listings)
  const featuredEquipment = await db.equipment.findMany({
    where: {
      isAvailable: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
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
  
  // Get a subset of categories for the homepage
  // Make sure EQUIPMENT_CATEGORIES is treated as an array
  const featuredCategories = Array.isArray(EQUIPMENT_CATEGORIES) 
    ? EQUIPMENT_CATEGORIES.slice(0, 6) 
    : (typeof EQUIPMENT_CATEGORIES === 'object' 
        ? Object.values(EQUIPMENT_CATEGORIES).slice(0, 6) as string[]
        : ["Construction Tools", "Power Tools", "Hand Tools", "Gardening & Landscaping", "Photography & Video", "Audio Equipment"]);
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-jacker-blue">
                Rent equipment from people in your area
              </h1>
              <p className="text-xl text-gray-600">
                <span className="font-bold text-jacker-orange">Don't buy it, rent it.</span> Jackerbox connects people who need equipment with those who have it.
                Find what you need or make money renting out your gear.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/routes/equipment"
                  className="px-6 py-3 bg-jacker-blue text-white rounded-md hover:bg-opacity-90 text-center"
                >
                  Find Equipment
                </Link>
                {user ? (
                  <Link
                    href="/routes/equipment/new"
                    className="px-6 py-3 border border-jacker-blue text-jacker-blue rounded-md hover:bg-jacker-blue hover:text-white transition-colors text-center"
                  >
                    List Your Equipment
                  </Link>
                ) : (
                  <Link
                    href="/auth/register"
                    className="px-6 py-3 bg-jacker-orange text-white rounded-md hover:bg-opacity-90 text-center"
                  >
                    Sign Up
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-72 h-72 bg-jacker-blue bg-opacity-20 rounded-lg"></div>
                <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-jacker-orange bg-opacity-20 rounded-lg"></div>
                <div className="relative z-10 bg-white p-4 rounded-lg shadow-lg">
                  <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                    <Image 
                      src="https://res.cloudinary.com/dgtqpyphg/image/upload/v1741276322/jackerbox/hero-equipment.jpg"
                      alt="Professional equipment rental"
                      width={600}
                      height={400}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How Jackerbox Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-jacker-blue bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-jacker-blue">1</span>
              </div>
              <h3 className="text-xl font-medium mb-2">Find Equipment</h3>
              <p className="text-gray-600">
                Browse thousands of items available for rent in your area.
                Filter by category, location, and price.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-jacker-orange bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-jacker-orange">2</span>
              </div>
              <h3 className="text-xl font-medium mb-2">Book & Pay</h3>
              <p className="text-gray-600">
                Reserve the equipment for the dates you need.
                Secure payment through our platform.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-jacker-blue bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-jacker-blue">3</span>
              </div>
              <h3 className="text-xl font-medium mb-2">Use & Return</h3>
              <p className="text-gray-600">
                Pick up the equipment, use it for your project,
                and return it when you're done.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Equipment Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Equipment</h2>
            <Link
              href="/routes/equipment"
              className="text-jacker-blue hover:underline"
            >
              View All →
            </Link>
          </div>
          
          {featuredEquipment.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No equipment listings yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEquipment.map((equipment) => (
                <Link
                  key={equipment.id}
                  href={`/routes/equipment/${equipment.id}`}
                  className="block rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 bg-gray-100">
                    {equipment.images && equipment.images.length > 0 ? (
                      <Image
                        src={equipment.images[0]}
                        alt={equipment.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={`https://res.cloudinary.com/dgtqpyphg/image/upload/v1741276323/jackerbox/equipment-sample-${(equipment.id.charCodeAt(0) % 5) + 1}.jpg`}
                        alt={equipment.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {equipment.isVerified && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Verified
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-lg truncate">{equipment.title}</h3>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {equipment.condition}
                      </span>
                    </div>
                    
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                      {equipment.description}
                    </p>
                    
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <span className="truncate">{equipment.location}</span>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-end">
                      <div>
                        {equipment.dailyRate && (
                          <p className="font-bold text-lg">
                            ${equipment.dailyRate}/day
                          </p>
                        )}
                        {!equipment.dailyRate && equipment.hourlyRate && (
                          <p className="font-bold text-lg">
                            ${equipment.hourlyRate}/hour
                          </p>
                        )}
                        {!equipment.dailyRate && !equipment.hourlyRate && equipment.weeklyRate && (
                          <p className="font-bold text-lg">
                            ${equipment.weeklyRate}/week
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-200 mr-2"></div>
                        <span className="text-sm text-gray-600">
                          {equipment.owner.name || "Owner"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {featuredCategories.map((category) => (
              <Link
                key={category}
                href={`/routes/equipment?category=${encodeURIComponent(category)}`}
                className="group block p-6 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-medium group-hover:text-jacker-blue">
                  {category}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Find {category.toLowerCase()} for your next project
                </p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/routes/equipment"
              className="inline-block px-6 py-3 border border-jacker-blue text-jacker-blue rounded-md hover:bg-jacker-blue hover:text-white transition-colors"
            >
              View All Categories
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-jacker-blue text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start renting?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of people who are already saving money by renting
            equipment instead of buying, or making extra income by renting out
            their gear.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/routes/equipment"
              className="px-6 py-3 bg-white text-jacker-blue rounded-md hover:bg-gray-100"
            >
              Find Equipment
            </Link>
            {user ? (
              <Link
                href="/routes/equipment/new"
                className="px-6 py-3 border border-white rounded-md hover:bg-jacker-blue hover:bg-opacity-80"
              >
                List Your Equipment
              </Link>
            ) : (
              <Link
                href="/auth/register"
                className="px-6 py-3 bg-jacker-orange text-white rounded-md hover:bg-opacity-90"
              >
                Sign Up
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
