"use client";

// Add dynamic export to ensure proper data fetching
export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { BookingForm } from "@/components/rentals/booking-form";
import { EquipmentActions } from "@/components/equipment/equipment-actions";
import { ImageGallery } from "@/components/equipment/image-gallery";
import Image from "next/image";
import { ContactOwnerButton } from "@/components/equipment/contact-owner-button";
import { Suspense } from "react";
import type { Metadata, ResolvingMetadata } from "next";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AvailabilityCalendar } from '@/components/equipment/availability-calendar';
import { formatPrice } from '@/lib/utils';
import { Equipment, User } from '@prisma/client';

// Import components normally instead of using dynamic imports
// We'll use Suspense boundaries for lazy loading
import { DualCalendarSystem } from "@/components/equipment/dual-calendar-system";
import { ReviewsSection } from "@/components/reviews/reviews-section";

interface EquipmentDetailPageProps {
  params: {
    id: string;
  };
}

interface EquipmentWithOwner {
  id: string;
  title: string;
  description: string;
  condition: string;
  location: string;
  hourlyRate: number | null;
  dailyRate: number | null;
  weeklyRate: number | null;
  isVerified: boolean;
  imagesJson: string | null;
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Booking {
  startDate: Date;
  endDate: Date;
  status: string;
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
      imagesjson: true,
    },
  });

  if (!equipment) {
    return {
      title: "Equipment Not Found | Jackerbox",
      description: "The requested equipment could not be found.",
    };
  }

  // Parse images from JSON string
  const images = equipment.imagesjson ? JSON.parse(equipment.imagesjson) : [];
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

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [equipment, setEquipment] = useState<EquipmentWithOwner | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDates, setSelectedDates] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await fetch(`/api/equipment/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch equipment');
        const data = await response.json();
        setEquipment(data);
      } catch (error) {
        setError('Failed to load equipment details');
        console.error('Error fetching equipment:', error);
      }
    };

    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/equipment/${params.id}/bookings`);
        if (!response.ok) throw new Error('Failed to fetch bookings');
        const data = await response.json();
        setBookings(data.bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipment();
    fetchBookings();
  }, [params.id]);

  const handleDateSelect = (startDate: Date, endDate: Date) => {
    setSelectedDates({ startDate, endDate });
  };

  const handleBooking = async () => {
    if (!selectedDates.startDate || !selectedDates.endDate) {
      setError('Please select rental dates');
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipmentId: params.id,
          startDate: selectedDates.startDate,
          endDate: selectedDates.endDate,
        }),
      });

      if (!response.ok) throw new Error('Failed to create booking');

      const booking = await response.json();
      router.push(`/bookings/${booking.id}`);
    } catch (error) {
      setError('Failed to create booking. Please try again.');
      console.error('Error creating booking:', error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error || !equipment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600">{error || 'Equipment not found'}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const rentalPeriod = selectedDates.startDate && selectedDates.endDate
    ? Math.ceil((selectedDates.endDate.getTime() - selectedDates.startDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const totalPrice = rentalPeriod * equipment.dailyRate;

  // Update property references
  const images = equipment.imagesJson ? JSON.parse(equipment.imagesJson) : [];
  const dailyRate = equipment.dailyRate;
  const ownerImage = equipment.owner.image;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Equipment Details */}
        <div className="space-y-6">
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <Image
              src={equipment.imageUrl || '/placeholder.png'}
              alt={equipment.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{equipment.title}</h1>
              <Badge variant="outline" className="text-lg">
                {formatPrice(equipment.dailyRate)}/day
              </Badge>
            </div>

            <p className="text-gray-600">{equipment.description}</p>

            <div className="flex items-center space-x-4">
              <Avatar>
                <Image
                  src={equipment.owner.imageUrl || '/placeholder-avatar.png'}
                  alt={equipment.owner.name || 'Owner'}
                  width={40}
                  height={40}
                />
              </Avatar>
              <div>
                <p className="font-medium">{equipment.owner.name}</p>
                <p className="text-sm text-gray-500">Owner</p>
              </div>
            </div>

            {equipment.distance && (
              <p className="text-sm text-gray-600">
                {Math.round(equipment.distance * 10) / 10} miles away
              </p>
            )}
          </div>
        </div>

        {/* Booking Section */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Book this equipment</h2>
            
            <AvailabilityCalendar
              equipmentId={equipment.id}
              existingBookings={bookings}
              onDateSelect={handleDateSelect}
              minRentalDays={1}
              maxRentalDays={30}
            />

            {selectedDates.startDate && selectedDates.endDate && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Daily rate</span>
                  <span>{formatPrice(equipment.dailyRate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Number of days</span>
                  <span>{rentalPeriod}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>

                <Button
                  onClick={handleBooking}
                  className="w-full"
                >
                  Book Now
                </Button>
              </div>
            )}
          </Card>

          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Suspense fallback={<div>Loading actions...</div>}>
          <EquipmentActions 
            equipmentId={equipment.id} 
            isOwner={currentUser?.id === equipment.owner.id} 
          />
        </Suspense>
      </div>

      <div className="mt-8">
        <Suspense fallback={<div>Loading contact button...</div>}>
          <ContactOwnerButton 
            ownerId={equipment.owner.id}
            equipmentId={equipment.id}
            equipmentTitle={equipment.title}
          />
        </Suspense>
      </div>
    </div>
  );
} 