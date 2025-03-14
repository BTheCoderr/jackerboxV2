// Add dynamic export to ensure proper data fetching
export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils/format";
import { BookingForm } from "@/components/rentals/booking-form";
import { EquipmentActions } from "@/components/equipment/equipment-actions";
import { AvailabilityCalendar } from "@/components/equipment/availability-calendar";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { ImageGallery } from "@/components/equipment/image-gallery";
import Image from "next/image";
import { ContactOwnerButton } from "@/components/equipment/contact-owner-button";
import { DualCalendarSystem } from "@/components/equipment/dual-calendar-system";

interface EquipmentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function EquipmentDetailPage({
  params,
}: EquipmentDetailPageProps) {
  // Get the id from params - using await to ensure it's resolved
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
  console.log("Parsed images:", images);

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
          {/* Image Gallery */}
          <ImageGallery images={images} title={equipment.title} />

          {/* Equipment Details */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-jacker-blue">{equipment.title}</h1>
            <div className="flex items-center mb-4">
              <span className="text-gray-600 mr-4">{equipment.category}</span>
              <span className="text-gray-600">{equipment.location}</span>
            </div>
            <p className="text-gray-700 mb-6">{equipment.description}</p>
            
            <h2 className="text-xl font-semibold mb-3 text-jacker-blue">Features</h2>
            <ul className="list-disc pl-5 mb-6 text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-2">
              {tags.map((tag) => (
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
          </div>

          {/* Availability Calendar */}
          <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <DualCalendarSystem 
              equipmentId={equipment.id} 
              isOwner={isOwner}
              existingBookings={[]}
            />
          </div>

          {/* Owner Information */}
          <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-jacker-blue">About the Owner</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 relative rounded-full overflow-hidden mr-4">
                  {equipment.owner.image ? (
                    <Image
                      src={equipment.owner.image}
                      alt={equipment.owner.name || 'Equipment Owner'}
                      fill
                      className="object-cover"
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

          {/* Reviews */}
          <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <ReviewsSection 
              equipmentId={equipment.id}
              isOwner={isOwner}
              currentUserId={user?.id}
            />
          </div>
        </div>
        
        {/* Right Column - Booking Form */}
        <div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm sticky top-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-jacker-blue">Pricing</h2>
              {equipment.dailyRate && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Daily Rate</span>
                  <span className="font-medium">{formatCurrency(equipment.dailyRate)}</span>
                </div>
              )}
              {equipment.weeklyRate && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Weekly Rate</span>
                  <span className="font-medium">{formatCurrency(equipment.weeklyRate)}</span>
                </div>
              )}
              {equipment.hourlyRate && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Hourly Rate</span>
                  <span className="font-medium">{formatCurrency(equipment.hourlyRate)}</span>
                </div>
              )}
              {equipment.securityDeposit && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                  <span className="text-gray-700">Security Deposit</span>
                  <span className="font-medium">{formatCurrency(equipment.securityDeposit)}</span>
                </div>
              )}
            </div>
            
            {!isOwner && user && (
              <BookingForm
                equipment={{
                  ...equipment,
                  owner: {
                    id: equipment.owner.id,
                    name: equipment.owner.name,
                    image: equipment.owner.image
                  }
                }}
              />
            )}
            
            {!isOwner && !user && (
              <div className="text-center p-4 bg-gray-50 rounded-md">
                <p className="text-gray-600 mb-4">Sign in to book this equipment</p>
                <Link
                  href="/auth/login"
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
            
            {isOwner && (
              <div className="text-center p-4 bg-gray-50 rounded-md">
                <p className="text-gray-600">This is your equipment listing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 