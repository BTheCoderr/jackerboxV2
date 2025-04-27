"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface VerificationRequest {
  id: string;
  userid: string;
  status: string;
  documenttype: string;
  documenturl: string;
  notes: string | null;
  submittedat: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AdminVerificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
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
    const fetchVerifications = async () => {
      try {
        const response = await fetch("/api/admin/verifications");
        const data = await response.json();
        setRequests(data.requests);
      } catch (error) {
        toast.error("Failed to load verification requests");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.role === "ADMIN") {
      fetchVerifications();
    }
  }, [session?.user?.role]);

  const handleVerification = async (requestId: string, userId: string, approved: boolean, notes?: string) => {
    try {
      const response = await fetch("/api/users/verify-id-secure", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          approved,
          notes,
        }),
      });

      if (!response.ok) throw new Error("Failed to update verification");

      // Update local state
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status: approved ? "APPROVED" : "REJECTED" }
            : req
        )
      );

      toast.success(`Verification ${approved ? "approved" : "rejected"}`);
    } catch (error) {
      toast.error("Failed to update verification status");
    }
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-8 w-1/4 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">ID Verification Requests</h1>

      <div className="mb-6">
        <Input
          placeholder="Search by user name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{request.user.name}</h3>
                <p className="text-sm text-gray-600">{request.user.email}</p>
                <p className="text-sm text-gray-500">
                  Submitted: {new Date(request.submittedat).toLocaleDateString()}
                </p>
                {request.notes && (
                  <p className="text-sm text-gray-600 mt-2">
                    Notes: {request.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Badge
                  className={
                    request.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : request.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {request.status}
                </Badge>

                {request.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        handleVerification(request.id, request.userid, true)
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleVerification(request.id, request.userid, false)
                      }
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {filteredRequests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No verification requests found
          </div>
        )}
      </div>
    </div>
  );
} 