"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Equipment } from "@prisma/client";
import { BookingForm } from "@/components/rentals/booking-form";
import { DualCalendarSystem } from "@/components/equipment/dual-calendar-system";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function RentalCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const equipmentId = searchParams.get("equipmentId");
  
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchEquipment = async () => {
      if (!equipmentId) {
        router.push("/");
        return;
      }
      
      try {
        const response = await fetch(`/api/equipment/${equipmentId}`);
        if (!response.ok) throw new Error("Failed to fetch equipment");
        
        const data = await response.json();
        setEquipment(data.equipment);
      } catch (error) {
        toast.error("Error loading equipment details");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEquipment();
  }, [equipmentId, router]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="p-6">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-40 w-full" />
        </Card>
      </div>
    );
  }
  
  if (!equipment) {
    return null;
  }
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Complete Your Rental</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Select Dates</h2>
            <DualCalendarSystem
              equipmentId={equipment.id}
              isOwner={false}
              existingBookings={[]}
            />
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
            <BookingForm equipment={equipment} />
          </div>
        </div>
      </Card>
    </div>
  );
} 