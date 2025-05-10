"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

interface Equipment {
  id: string;
  title: string;
  description: string;
  imagesJson?: string;
  status: string;
}

interface Rental {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  equipment: Equipment;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [ownedEquipment, setOwnedEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user?.id) return;

      try {
        // Fetch user's rentals
        const rentalsResponse = await fetch("/api/rentals?type=renter");
        const rentalsData = await rentalsResponse.json();
        setRentals(rentalsData.rentals || []);

        // Fetch user's equipment
        const equipmentResponse = await fetch("/api/equipment/owned");
        const equipmentData = await equipmentResponse.json();
        setOwnedEquipment(equipmentData.equipment || []);
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session?.user?.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-8 w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
            </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <Tabs defaultValue="rentals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rentals">My Rentals</TabsTrigger>
          <TabsTrigger value="equipment">My Equipment</TabsTrigger>
        </TabsList>

        <TabsContent value="rentals">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rentals.map((rental) => (
              <Card key={rental.id} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold">{rental.equipment.title}</h3>
                  <Badge className={getStatusColor(rental.status)}>
                    {rental.status}
                  </Badge>
          </div>

                <p className="text-sm text-gray-600 mb-4">
                          {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                        </p>

                <Link href={`/routes/rentals/${rental.id}`}>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </Card>
            ))}

            {rentals.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 mb-4">You haven't rented any equipment yet.</p>
                <Link href="/routes/equipment">
                  <Button>Browse Equipment</Button>
                  </Link>
                </div>
              )}
          </div>
        </TabsContent>

        <TabsContent value="equipment">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownedEquipment.map((equipment) => (
              <Card key={equipment.id} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold">{equipment.title}</h3>
                  <Badge className={getStatusColor(equipment.status)}>
                    {equipment.status}
                  </Badge>
            </div>
            
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {equipment.description}
                </p>

                <div className="space-y-2">
                  <Link href={`/routes/equipment/${equipment.id}`}>
                    <Button variant="outline" className="w-full">
                      View Listing
                    </Button>
                  </Link>
                  <Link href={`/routes/equipment/${equipment.id}/edit`}>
                    <Button variant="outline" className="w-full">
                      Edit Listing
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}

            {ownedEquipment.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 mb-4">You haven't listed any equipment yet.</p>
                <Link href="/routes/equipment/new">
                  <Button>List Equipment</Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    );
} 