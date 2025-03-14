// Add dynamic export to ensure proper data fetching
export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils/format";
import { BookingForm } from "@/components/rentals/booking-form";
import { EquipmentActions } from "@/components/equipment/equipment-actions";
import { ImageGallery } from "@/components/equipment/image-gallery";
import Image from "next/image";
import { ContactOwnerButton } from "@/components/equipment/contact-owner-button";
import { Suspense } from "react";
import type { Metadata, ResolvingMetadata } from "next";

// Import components normally instead of using dynamic imports
// We'll use Suspense boundaries for lazy loading
import { DualCalendarSystem } from "@/components/equipment/dual-calendar-system";
import { ReviewsSection } from "@/components/reviews/reviews-section";

interface EquipmentDetailPageProps {
  params: {
    id: string;
  };
}

// Generate metadata for better SEO
export async function generateMetadata(
  { params }: EquipmentDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get the id from params
  const equipmentId = params.id;
  
  // Fetch the equipment with owner details
  const equipment = await db.equipment.findUnique({
    where: {
      id: equipmentId,
    },
    select: {
      title: true,
      description: true,
      category: true,
      location: true,
      imagesJson: true,
    },
  });

  if (!equipment) {
    return {
      title: "Equipment Not Found | Jackerbox",
      description: "The requested equipment could not be found.",
    };
  }

  // Parse images from JSON string
  const images = equipment.imagesJson ? JSON.parse(equipment.imagesJson) : [];
  const firstImage = images.length > 0 ? images[0] : null;

  // Create a description that's not too long
  const description = equipment.description.length > 160
    ? `${equipment.description.substring(0, 157)}...`
    : equipment.description;

  return {
    title: `${equipment.title} | Jackerbox`,
    description,
    openGraph: {
      title: `${equipment.title} | Jackerbox`,
      description,
      images: firstImage ? [firstImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${equipment.title} | Jackerbox`,
      description,
      images: firstImage ? [firstImage] : [],
    },
  };
}

export default async function EquipmentDetailPage({
  params,
}: EquipmentDetailPageProps) {
  // Get the id from params - properly awaited
  const equipmentId = await Promise.resolve(params.id);
  
  const user = await getCurrentUser();
  
  // Fetch the equipment with owner details
  const equipment = await db.equipment.findUnique({
    where: {
      id: equipmentId,
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

  if (!equipment) {
    notFound();
  }

  // Parse images from JSON string
  const images = equipment.imagesJson ? JSON.parse(equipment.imagesJson) : [];

  // Parse tags from JSON string
  const tags = equipment.tagsJson ? JSON.parse(equipment.tagsJson) : [];

  // Check if the current user is the owner
  const isOwner = user?.id === equipment.ownerId;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-jacker-blue">{equipment.title}</h1>
        {isOwner && (
          <EquipmentActions equipmentId={equipment.id} isOwner={isOwner} />
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2">
          {/* Image Gallery - Critical for LCP */}
          <ImageGallery images={images} title={equipment.title} />

          {/* Equipment Details - Critical content */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-jacker-blue">{equipment.title}</h2>
            <div className="flex items-center mb-4">
              <span className="text-gray-600 mr-4">{equipment.category}</span>
              <span className="text-gray-600">{equipment.location}</span>
            </div>
            <p className="text-gray-700 mb-6">{equipment.description}</p>
            
            <h2 className="text-xl font-semibold mb-3 text-jacker-blue">Features</h2>
            <ul className="list-disc pl-5 mb-6 text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-2">
              {tags.map((tag: string) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            
            <h2 className="text-xl font-semibold mb-3 text-jacker-blue">Rental Rules</h2>
            <ul className="list-disc pl-5 mb-6 text-gray-700">
              {[
                "Valid ID and credit card required",
                "No international travel without prior approval",
                "Renter is responsible for any damage",
                "Equipment must be returned in original condition",
                "Late returns will incur additional daily rate",
              ].map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 relative rounded-full overflow-hidden mr-4">
                  {equipment.owner.image ? (
                    <Image
                      src={equipment.owner.image}
                      alt={equipment.owner.name || 'Equipment Owner'}
                      fill
                      sizes="64px"
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-xl font-semibold">
                      {equipment.owner.name ? equipment.owner.name.charAt(0).toUpperCase() : '👤'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-lg">{equipment.owner.name}</h3>
                  <p className="text-gray-600 text-sm">Member since {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              
              {!isOwner && (
                <ContactOwnerButton 
                  ownerId={equipment.owner.id} 
                  equipmentId={equipment.id}
                  equipmentTitle={equipment.title}
                />
              )}
            </div>
          </div>

          {/* Reviews - Lazy loaded */}
          <Suspense fallback={
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          }>
            <ReviewsSection 
              equipmentId={equipment.id} 
              isOwner={isOwner} 
              currentUserId={user?.id}
            />
          </Suspense>
        </div>
        
        {/* Right Column - Booking and Calendar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-jacker-blue">Rental Rates</h2>
              <div className="space-y-2">
                {equipment.hourlyRate && (
                  <div className="flex justify-between">
                    <span>Hourly Rate:</span>
                    <span className="font-semibold">{formatCurrency(equipment.hourlyRate)}</span>
                  </div>
                )}
                {equipment.dailyRate && (
                  <div className="flex justify-between">
                    <span>Daily Rate:</span>
                    <span className="font-semibold">{formatCurrency(equipment.dailyRate)}</span>
                  </div>
                )}
                {equipment.weeklyRate && (
                  <div className="flex justify-between">
                    <span>Weekly Rate:</span>
                    <span className="font-semibold">{formatCurrency(equipment.weeklyRate)}</span>
                  </div>
                )}
                {equipment.securityDeposit && (
                  <div className="flex justify-between text-gray-600 text-sm mt-2 pt-2 border-t">
                    <span>Security Deposit:</span>
                    <span>{formatCurrency(equipment.securityDeposit)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {!isOwner && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <BookingForm 
                  equipment={{
                    id: equipment.id,
                    title: equipment.title,
                    hourlyRate: equipment.hourlyRate,
                    dailyRate: equipment.dailyRate,
                    weeklyRate: equipment.weeklyRate,
                    securityDeposit: equipment.securityDeposit,
                  }}
                />
              </div>
            )}
            
            {/* Calendar - Lazy loaded */}
            <Suspense fallback={
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            }>
              <div className="bg-white rounded-lg shadow-md p-6">
                <DualCalendarSystem 
                  equipmentId={equipment.id}
                  isOwner={isOwner}
                />
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
} 