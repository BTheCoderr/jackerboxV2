"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  status: string;
}

interface Equipment {
  id: string;
  title: string;
  owner: {
    name: string;
    email: string;
  };
  status: string;
  isVerified: boolean;
  reportCount: number;
}

interface PlatformStats {
  totalUsers: number;
  totalEquipment: number;
  totalRentals: number;
  platformRevenue: number;
  activeRentals: number;
  pendingVerifications: number;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalEquipment: 0,
    totalRentals: 0,
    platformRevenue: 0,
    activeRentals: 0,
    pendingVerifications: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // Check if user is admin
    if (session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch platform stats
        const statsResponse = await fetch("/api/admin/stats");
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch users
        const usersResponse = await fetch("/api/admin/users");
        const usersData = await usersResponse.json();
        setUsers(usersData.users);

        // Fetch equipment
        const equipmentResponse = await fetch("/api/admin/equipment");
        const equipmentData = await equipmentResponse.json();
        setEquipment(equipmentData.equipment);
      } catch (error) {
        toast.error("Failed to load admin data");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.role === "ADMIN") {
      fetchAdminData();
    }
  }, [session?.user?.role]);

  const handleUserAction = async (userId: string, action: "suspend" | "activate") => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error(`Failed to ${action} user`);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, status: action === "activate" ? "ACTIVE" : "SUSPENDED" }
            : user
        )
      );

      toast.success(`User ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleEquipmentAction = async (equipmentId: string, action: "verify" | "remove") => {
    try {
      const response = await fetch(`/api/admin/equipment/${equipmentId}/${action}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error(`Failed to ${action} equipment`);

      if (action === "remove") {
        setEquipment((prev) => prev.filter((eq) => eq.id !== equipmentId));
      } else {
        setEquipment((prev) =>
          prev.map((eq) =>
            eq.id === equipmentId ? { ...eq, isVerified: true } : eq
          )
        );
      }

      toast.success(`Equipment ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} equipment`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-8 w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEquipment = equipment.filter(
    (eq) =>
      eq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Total Equipment</p>
              <p className="text-2xl font-bold">{stats.totalEquipment}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <DollarSign className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Platform Revenue</p>
              <p className="text-2xl font-bold">
                ${stats.platformRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Pending Verifications</p>
              <p className="text-2xl font-bold">{stats.pendingVerifications}</p>
              <Link
                href="/routes/admin/verifications"
                className="text-sm text-blue-600 hover:underline"
              >
                View All →
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search users or equipment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="grid grid-cols-1 gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge
                      className={
                        user.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {user.status}
                    </Badge>
                    {user.status === "ACTIVE" ? (
                      <Button
                        variant="outline"
                        onClick={() => handleUserAction(user.id, "suspend")}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleUserAction(user.id, "activate")}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="equipment">
          <div className="grid grid-cols-1 gap-4">
            {filteredEquipment.map((eq) => (
              <Card key={eq.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{eq.title}</h3>
                    <p className="text-sm text-gray-600">
                      Owner: {eq.owner.name} ({eq.owner.email})
                    </p>
                    {eq.reportCount > 0 && (
                      <p className="text-sm text-red-600">
                        Reports: {eq.reportCount}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge
                      className={
                        eq.isVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {eq.isVerified ? "Verified" : "Pending"}
                    </Badge>
                    {!eq.isVerified && (
                      <Button
                        variant="outline"
                        onClick={() => handleEquipmentAction(eq.id, "verify")}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        Verify
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleEquipmentAction(eq.id, "remove")}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 