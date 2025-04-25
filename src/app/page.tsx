"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry";

interface Equipment {
  id: string;
  title: string;
  description: string;
  condition: string;
  location: string;
  hourlyRate: number | null;
  dailyRate: number | null;
  weeklyRate: number | null;
  isVerified: boolean;
  images?: string[];
  imagesJson?: string;
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export default function HomePage() {
  const { data: session } = useSession();
  const [featuredEquipment, setFeaturedEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({});
  
  const fetchFeaturedEquipment = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use fetchWithRetry instead of regular fetch
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/equipment?limit=6`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        maxRetries: 2, // Try up to 3 times total (initial + 2 retries)
        retryDelay: 800 // Start with 800ms delay, then increase by backoffFactor
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeaturedEquipment(data.equipment || []);
      } else {
        console.error("Error fetching equipment:", response.statusText);
        setError(`Failed to load equipment: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching featured equipment:", error);
      setError(`Failed to load equipment: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchFeaturedEquipment();
  }, [fetchFeaturedEquipment]);
  
  // Handle image load errors
  const handleImageError = (id: string) => {
    setImageLoadError(prev => ({
      ...prev,
      [id]: true
    }));
  };

  // Helper function to get placeholder image
  const getPlaceholderImage = () => {
    // Use Cloudinary's built-in placeholder
    return 'https://res.cloudinary.com/dgtqpyphg/image/upload/c_scale,w_400,h_300/e_blur:1000,q_1,f_auto/sample';
  };

  // Get equipment image source with fallback
  const getEquipmentImageSrc = (equipment: Equipment, index: number = 0) => {
    // If image already failed to load, use fallback
    if (imageLoadError[equipment.id]) {
      return getPlaceholderImage();
    }
    
    // Try to get image from images array
    if (equipment.images && equipment.images.length > 0) {
      return equipment.images[0];
    }
    
    // Try to parse imagesJson
    if (equipment.imagesJson) {
      try {
        const images = JSON.parse(equipment.imagesJson);
        if (images && images.length > 0) {
          return images[0];
        }
      } catch (e) {
        console.error("Error parsing imagesJson", e);
      }
    }
    
    // Fallback to numbered placeholder based on ID
    return getPlaceholderImage();
  };
  
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
                {session?.user ? (
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
                      src="/images/hero-equipment.jpg"
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
            <button 
              onClick={fetchFeaturedEquipment}
              className="px-4 py-2 text-jacker-blue hover:text-jacker-orange transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={fetchFeaturedEquipment}
                className="px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-opacity-90"
              >
                Try Again
              </button>
            </div>
          ) : featuredEquipment.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No equipment listings yet.</p>
              <button 
                onClick={fetchFeaturedEquipment}
                className="mt-4 px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-opacity-90"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEquipment.map((equipment, index) => (
                <Link
                  key={equipment.id}
                  href={`/routes/equipment/${equipment.id}`}
                  className="block rounded-lg overflow-hidden border hover:shadow-md transition-shadow bg-white"
                >
                  <div className="relative h-48 bg-gray-100">
                    <Image
                      src={getEquipmentImageSrc(equipment, index)}
                      alt={equipment.title}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(equipment.id)}
                    />
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
                        {equipment.owner.image ? (
                          <Image
                            src={equipment.owner.image}
                            alt={equipment.owner.name || "Owner"}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-xs text-gray-600">
                            {equipment.owner.name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
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
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4 flex items-center justify-center text-lg font-bold text-gray-600">J</div>
                <div>
                  <h3 className="font-medium">John D.</h3>
                  <p className="text-sm text-gray-500">Equipment Owner</p>
                </div>
              </div>
              <p className="text-gray-600">
                "I've made over $2,000 renting out my tools that were just sitting in my garage. Jackerbox made it easy to list and manage my equipment."
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4 flex items-center justify-center text-lg font-bold text-gray-600">S</div>
                <div>
                  <h3 className="font-medium">Sarah M.</h3>
                  <p className="text-sm text-gray-500">Renter</p>
                </div>
              </div>
              <p className="text-gray-600">
                "Saved me hundreds on a weekend project. Found exactly what I needed, and the owner was super helpful with tips on how to use the equipment."
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4 flex items-center justify-center text-lg font-bold text-gray-600">M</div>
                <div>
                  <h3 className="font-medium">Michael T.</h3>
                  <p className="text-sm text-gray-500">Equipment Owner & Renter</p>
                </div>
              </div>
              <p className="text-gray-600">
                "I both rent and list equipment on Jackerbox. The platform is intuitive, and the customer service is excellent. Highly recommend!"
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-jacker-blue text-white rounded-lg p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-xl mb-8">
                Join thousands of users who are already saving money and making extra income with Jackerbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/routes/equipment"
                  className="px-6 py-3 bg-white text-jacker-blue rounded-md hover:bg-gray-100 text-center"
                >
                  Browse Equipment
                </Link>
                {!session?.user && (
                  <Link
                    href="/auth/register"
                    className="px-6 py-3 bg-jacker-orange text-white rounded-md hover:bg-opacity-90 text-center"
                  >
                    Create Account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
