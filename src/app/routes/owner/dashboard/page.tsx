"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Equipment {
  id: string;
  title: string;
  description: string;
  dailyRate: number;
  status: string;
  imagesJson?: string;
}

interface RentalRequest {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  equipment: Equipment;
  renter: {
    id: string;
    name: string;
    image?: string;
  };
}

interface Stats {
  totalEquipment: number;
  activeRentals: number;
  totalEarnings: number;
  pendingRequests: number;
}

export default function OwnerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalEquipment: 0,
    activeRentals: 0,
    totalEarnings: 0,
    pendingRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchOwnerData = async () => {
      if (!session?.user?.id) return;

      try {
        // Fetch owner's equipment
        const equipmentResponse = await fetch("/api/equipment/owned");
        const equipmentData = await equipmentResponse.json();
        setEquipment(equipmentData.equipment || []);

        // Fetch rental requests
        const requestsResponse = await fetch("/api/rentals?type=owner");
        const requestsData = await requestsResponse.json();
        setRentalRequests(requestsData.rentals || []);

        // Fetch owner stats
        const statsResponse = await fetch("/api/owner/stats");
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnerData();
  }, [session?.user?.id]);

  const handleRentalAction = async (rentalId: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/rentals/${rentalId}/${action}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error(`Failed to ${action} rental`);

      // Update rental requests list
      setRentalRequests((prev) =>
        prev.map((request) =>
          request.id === rentalId
            ? { ...request, status: action === "approve" ? "APPROVED" : "REJECTED" }
            : request
        )
      );

      toast.success(`Rental ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} rental`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-8 w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <Link href="/routes/equipment/new">
          <Button>List New Equipment</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total Equipment</p>
              <p className="text-2xl font-bold">{stats.totalEquipment}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Active Rentals</p>
              <p className="text-2xl font-bold">{stats.activeRentals}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <DollarSign className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold">
                ${stats.totalEarnings.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Rental Requests</TabsTrigger>
          <TabsTrigger value="equipment">My Equipment</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <div className="grid grid-cols-1 gap-4">
            {rentalRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{request.equipment.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(request.startDate).toLocaleDateString()} -{" "}
                      {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Requested by: {request.renter.name}
                    </p>
                    <p className="font-medium mt-2">
                      ${request.totalPrice.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {request.status === "PENDING" && (
                      <>
                        <Button
                          onClick={() => handleRentalAction(request.id, "approve")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRentalAction(request.id, "reject")}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {request.status !== "PENDING" && (
                      <Badge
                        className={
                          request.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {request.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {rentalRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No rental requests yet
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="equipment">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.description}
                    </p>
                    <p className="font-medium mt-2">${item.dailyRate}/day</p>
                  </div>
                  <Badge
                    className={
                      item.status === "AVAILABLE"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Link href={`/routes/equipment/${item.id}`}>
                    <Button variant="outline" className="w-full">
                      View Listing
                    </Button>
                  </Link>
                  <Link href={`/routes/equipment/${item.id}/edit`}>
                    <Button variant="outline" className="w-full">
                      Edit Listing
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 