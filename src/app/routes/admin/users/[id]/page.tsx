// Add dynamic export to ensure proper server-side rendering
export const dynamic = 'force-dynamic';

import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/format";

interface AdminUserDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  // Properly await the params.id
  const userId = await Promise.resolve(params.id);
  
  const currentUser = await getCurrentUser();
  
  if (!currentUser?.isAdmin) {
    throw new Error("Unauthorized");
  }
  
  // Fix the include property to use the correct relation names
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      equipmentListings: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
      rentals: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        include: {
          equipment: true,
        },
      },
    },
  });
  
  if (!user) {
    notFound();
  }
  
  // Calculate user stats
  const equipmentCount = await db.equipment.count({
    where: {
      ownerId: user.id,
    },
  });
  
  // Fix the where clause to use renterId instead of userId
  const rentalCount = await db.rental.count({
    where: {
      renterId: user.id,
    },
  });
  
  // Fix the where clause to use renterId instead of userId
  const totalSpent = await db.payment.aggregate({
    where: {
      rental: {
        renterId: user.id,
      },
      status: "COMPLETED",
    },
    _sum: {
      amount: true,
    },
  });
  
  const totalEarned = await db.payment.aggregate({
    where: {
      rental: {
        equipment: {
          ownerId: user.id,
        },
      },
      status: "COMPLETED",
      ownerPaidOut: true,
    },
    _sum: {
      ownerPaidOutAmount: true,
    },
  });
  
  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/routes/admin/users" className="text-jacker-blue hover:underline">
          ← Back to Users
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-4">
              {user.image ? (
                <Image 
                  src={user.image} 
                  alt={user.name || ""} 
                  width={64}
                  height={64}
                  className="h-full w-full object-cover" 
                />
              ) : (
                <span className="text-gray-500 text-xl font-medium">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name || "No name"}</h1>
              <p className="text-gray-500">{user.email}</p>
            </div>
            <div className="ml-auto">
              <span className={`px-2 py-1 text-xs rounded-full ${
                user.isAdmin
                  ? "bg-purple-100 text-purple-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {user.isAdmin ? "Admin" : "User"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">User Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{user.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Verified</p>
                  <p>{user.phoneVerified ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">ID Verification</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.idVerified
                        ? "bg-green-100 text-green-800"
                        : user.idVerificationStatus === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : user.idVerificationStatus === "requires_input"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {user.idVerified
                        ? "Verified"
                        : user.idVerificationStatus
                        ? user.idVerificationStatus.charAt(0).toUpperCase() + user.idVerificationStatus.slice(1)
                        : "Not Verified"}
                    </span>
                  </p>
                </div>
                {user.idVerificationDate && (
                  <div>
                    <p className="text-sm text-gray-500">Verified On</p>
                    <p>{new Date(user.idVerificationDate).toLocaleDateString()}</p>
                  </div>
                )}
                <div className="pt-2">
                  <form action="/api/admin/users/verify" method="POST">
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-opacity-90"
                      disabled={user.idVerified}
                    >
                      {user.idVerified ? "Already Verified" : "Manually Verify ID"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Equipment Listed</h2>
          <p className="text-3xl font-bold">{equipmentCount}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Rentals Made</h2>
          <p className="text-3xl font-bold">{rentalCount}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Total Spent</h2>
          <p className="text-3xl font-bold">${totalSpent._sum?.amount?.toFixed(2) || "0.00"}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Total Earned</h2>
          <p className="text-3xl font-bold">${totalEarned._sum?.ownerPaidOutAmount?.toFixed(2) || "0.00"}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Recent Equipment</h2>
              <Link href={`/routes/admin/equipment?owner=${user.id}`} className="text-blue-600 hover:underline text-sm">
                View All
              </Link>
            </div>
            
            {user.equipmentListings.length === 0 ? (
              <p className="text-gray-500">No equipment listed</p>
            ) : (
              <div className="space-y-4">
                {user.equipmentListings.map((item) => (
                  <Link
                    key={item.id}
                    href={`/routes/admin/equipment/${item.id}`}
                    className="block p-4 border rounded-md hover:bg-gray-50"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-500">${item.dailyRate}/day</p>
                      </div>
                      <div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Recent Rentals</h2>
              <Link href={`/routes/admin/rentals?user=${user.id}`} className="text-blue-600 hover:underline text-sm">
                View All
              </Link>
            </div>
            
            {user.rentals.length === 0 ? (
              <p className="text-gray-500">No rentals made</p>
            ) : (
              <div className="space-y-4">
                {user.rentals.map((rental) => (
                  <Link
                    key={rental.id}
                    href={`/routes/admin/rentals/${rental.id}`}
                    className="block p-4 border rounded-md hover:bg-gray-50"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{rental.equipment.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          rental.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                          rental.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                          rental.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {rental.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Total: {formatCurrency(rental.totalPrice)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end space-x-4">
        <form action="/api/admin/users/toggle-admin" method="POST" className="inline-block">
          <input type="hidden" name="userId" value={user.id} />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            {user.isAdmin ? "Remove Admin Status" : "Make Admin"}
          </button>
        </form>
        
        {user.id !== currentUser.id && (
          <form action="/api/admin/users/delete" method="POST" className="inline-block">
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
                  e.preventDefault();
                }
              }}
            >
              Delete User
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 