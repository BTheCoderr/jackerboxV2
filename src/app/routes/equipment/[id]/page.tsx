import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils/format";
import { BookingForm } from "@/components/rentals/booking-form";
import { EquipmentActions } from "@/components/equipment/equipment-actions";
import Image from "next/image";

interface EquipmentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function EquipmentDetailPage({
  params,
}: EquipmentDetailPageProps) {
  const user = await getCurrentUser();
  
  // Fetch the equipment with owner details
  const equipment = await db.equipment.findUnique({
    where: {
      id: params.id,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
          createdAt: true,
        },
      },
      reviews: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
  
  if (!equipment) {
    notFound();
  }
  
  // Parse JSON strings
  const images = equipment.imagesJson ? JSON.parse(equipment.imagesJson) : [];
  const tags = equipment.tagsJson ? JSON.parse(equipment.tagsJson) : [];
  
  // Calculate average rating
  const averageRating =
    equipment.reviews.length > 0
      ? equipment.reviews.reduce((acc, review) => acc + review.rating, 0) /
        equipment.reviews.length
      : 0;
  
  const isOwner = user?.id === equipment.ownerId;
  
  // Define rental rules (since there's no rulesJson field in the schema)
  const rentalRules = [
    "Valid ID and credit card required",
    "No international travel without prior approval",
    "Renter is responsible for any damage",
    "Equipment must be returned in original condition",
    "Late returns will incur additional daily rate"
  ];
  
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
          <div className="mb-8">
            <div className="aspect-w-16 aspect-h-9 mb-4">
              <Image
                src={images[0] || '/images/placeholder.svg'}
                alt={equipment.title}
                fill
                className="rounded-lg object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {images.slice(1).map((image: string, index: number) => (
                <div key={index} className="aspect-w-3 aspect-h-2">
                  <Image
                    src={image}
                    alt={`${equipment.title} - view ${index + 2}`}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

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
              {tags.map((tag: string) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            
            <h2 className="text-xl font-semibold mb-3 text-jacker-blue">Rental Rules</h2>
            <ul className="list-disc pl-5 mb-6 text-gray-700">
              {rentalRules.map((rule: string) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>

          {/* Owner Information */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4 text-jacker-blue">About the Owner</h2>
            <div className="flex items-center">
              <div className="relative w-16 h-16 mr-4">
                {equipment.owner.image ? (
                  <Image
                    src={equipment.owner.image}
                    alt={equipment.owner.name || "Owner"}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 text-xl">?</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-lg">{equipment.owner.name || "Owner"}</h3>
                <div className="flex items-center mb-1">
                  <svg className="w-5 h-5 text-jacker-orange" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-gray-700">
                    {averageRating.toFixed(1)} ({equipment.reviews.length} reviews)
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  Member since {new Date(equipment.owner.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Booking and Pricing */}
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
            
            {user ? (
              <BookingForm equipment={equipment} />
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="text-lg font-medium text-jacker-blue mb-2">Want to rent this equipment?</h3>
                <p className="text-gray-600 mb-4">Sign in or create an account to book this equipment.</p>
                <div className="space-y-3">
                  <Link 
                    href="/auth/login" 
                    className="block w-full py-2 bg-jacker-blue text-white rounded-md hover:bg-opacity-90 text-center"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="block w-full py-2 bg-jacker-orange text-white rounded-md hover:bg-opacity-90 text-center"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-4">
                You won't be charged yet. Payment will be processed after the owner approves your booking request.
              </p>
              <Link 
                href="#" 
                className="text-jacker-blue hover:underline text-sm inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                View cancellation policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 