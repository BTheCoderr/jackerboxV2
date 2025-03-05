export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Rentals | Jackerbox",
  description: "View and manage your equipment rentals",
};

export default async function MyRentalsPage() {
  const user = await getCurrentUser();
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/auth/login?callbackUrl=/routes/dashboard/rentals");
  }
  
  // Get user's rentals (as renter)
  const myRentals = await db.rental.findMany({
    where: {
      renterId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      equipment: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      payment: true,
    },
  });
  
  // Get equipment rentals (as owner)
  const equipmentRentals = await db.rental.findMany({
    where: {
      equipment: {
        ownerId: user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      equipment: true,
      renter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payment: true,
    },
  });
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  
  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Rentals</h1>
      
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Equipment I've Rented</h2>
            <p className="text-gray-500 text-sm">
              View and manage equipment you've rented from others
            </p>
          </div>
          
          {myRentals.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">You haven't rented any equipment yet.</p>
              <Link
                href="/routes/browse"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Browse Equipment
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myRentals.map((rental) => (
                    <tr key={rental.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/routes/equipment/${rental.equipment.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {rental.equipment.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rental.equipment.owner.name || rental.equipment.owner.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(rental.totalPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                            rental.status
                          )}`}
                        >
                          {rental.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/routes/rentals/${rental.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">My Equipment Rentals</h2>
            <p className="text-gray-500 text-sm">
              View and manage rentals of equipment you own
            </p>
          </div>
          
          {equipmentRentals.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">You don't have any equipment rentals yet.</p>
              <Link
                href="/routes/equipment/new"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                List Your Equipment
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Renter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {equipmentRentals.map((rental) => (
                    <tr key={rental.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/routes/equipment/${rental.equipment.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {rental.equipment.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rental.renter.name || rental.renter.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(rental.totalPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                            rental.status
                          )}`}
                        >
                          {rental.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/routes/rentals/${rental.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 