// Add dynamic export to ensure proper data fetching
export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { formatCurrency, formatDateRange } from "@/lib/utils/format";

interface RentalsPageProps {
  searchParams: {
    type?: string; // "renter" or "owner"
    status?: string;
  };
}

export default async function RentalsPage({ searchParams }: RentalsPageProps) {
  // Ensure user is authenticated
  const user = await requireAuth();
  
  // Extract search parameters safely for Next.js 15.2.0
  const params = await Promise.resolve(searchParams);
  const type = params.type || '';
  const status = params.status || '';
  
  // Determine if viewing as renter or owner
  const viewType = type === "owner" ? "owner" : "renter";
  
  // Build the where clause for filtering
  let whereClause: any = {};
  
  if (status) {
    whereClause.status = status;
  }
  
  if (viewType === "renter") {
    whereClause.renterId = user.id;
  } else {
    whereClause.equipment = {
      ownerId: user.id,
    };
  }
  
  // Fetch rentals
  const rentals = await db.rental.findMany({
    where: whereClause,
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
              image: true,
            },
          },
        },
      },
      renter: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      payment: true,
      review: true,
    },
  });
  
  // Define status filters
  const statusFilters = [
    { label: "All", value: "" },
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Completed", value: "Completed" },
    { label: "Cancelled", value: "Cancelled" },
    { label: "Rejected", value: "Rejected" },
  ];
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Rentals</h1>
          <p className="text-gray-600">
            {viewType === "renter"
              ? "Equipment you've rented from others"
              : "Your equipment rented by others"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <Link
              href="/routes/rentals?type=renter"
              className={`px-4 py-2 text-sm font-medium border rounded-l-lg ${
                viewType === "renter"
                  ? "bg-gray-100 text-gray-900"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              As Renter
            </Link>
            <Link
              href="/routes/rentals?type=owner"
              className={`px-4 py-2 text-sm font-medium border border-l-0 rounded-r-lg ${
                viewType === "owner"
                  ? "bg-gray-100 text-gray-900"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              As Owner
            </Link>
          </div>
          
          <select
            className="px-4 py-2 border rounded-md text-sm"
            onChange={(e) => {
              const url = new URL(window.location.href);
              if (e.target.value) {
                url.searchParams.set("status", e.target.value);
              } else {
                url.searchParams.delete("status");
              }
              url.searchParams.set("type", viewType);
              window.location.href = url.toString();
            }}
            defaultValue={status}
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {rentals.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <h3 className="text-lg font-medium">No rentals found</h3>
          <p className="text-gray-500 mt-1">
            {viewType === "renter"
              ? "You haven't rented any equipment yet"
              : "No one has rented your equipment yet"}
          </p>
          {viewType === "renter" && (
            <Link
              href="/routes/equipment"
              className="mt-4 inline-block px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-opacity-90"
            >
              Browse Equipment
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {rentals.map((rental) => (
            <div
              key={rental.id}
              className="border rounded-lg overflow-hidden bg-white"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                {/* Equipment image and details */}
                <div className="md:col-span-1">
                  <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100">
                    {rental.equipment.imagesJson && JSON.parse(rental.equipment.imagesJson).length > 0 ? (
                      <img
                        src={JSON.parse(rental.equipment.imagesJson)[0]}
                        alt={rental.equipment.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Rental details */}
                <div className="md:col-span-2">
                  <Link
                    href={`/routes/equipment/${rental.equipment.id}`}
                    className="text-lg font-medium hover:underline"
                  >
                    {rental.equipment.title}
                  </Link>
                  
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{rental.equipment.location}</span>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center">
                      <span className="text-gray-600 w-32">Rental Period:</span>
                      <span>
                        {formatDateRange(rental.startDate, rental.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 w-32">Total Price:</span>
                      <span className="font-medium">
                        {formatCurrency(rental.totalPrice)}
                      </span>
                    </div>
                    {rental.securityDeposit && (
                      <div className="flex items-center">
                        <span className="text-gray-600 w-32">Security Deposit:</span>
                        <span>{formatCurrency(rental.securityDeposit)}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="text-gray-600 w-32">Status:</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          rental.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : rental.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : rental.status === "Completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rental.status}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 w-32">
                        {viewType === "renter" ? "Owner:" : "Renter:"}
                      </span>
                      <div className="flex items-center">
                        {viewType === "renter" ? (
                          <>
                            {rental.equipment.owner.image ? (
                              <img
                                src={rental.equipment.owner.image}
                                alt={rental.equipment.owner.name || "Owner"}
                                className="w-6 h-6 rounded-full mr-2"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 mr-2"></div>
                            )}
                            <span>
                              {rental.equipment.owner.name || "Owner"}
                            </span>
                          </>
                        ) : (
                          <>
                            {rental.renter.image ? (
                              <img
                                src={rental.renter.image}
                                alt={rental.renter.name || "Renter"}
                                className="w-6 h-6 rounded-full mr-2"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 mr-2"></div>
                            )}
                            <span>{rental.renter.name || "Renter"}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="md:col-span-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {rental.status === "Pending" && viewType === "owner" && (
                      <>
                        <button className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">
                          Approve
                        </button>
                        <button className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700">
                          Reject
                        </button>
                      </>
                    )}
                    
                    {rental.status === "Approved" && (
                      <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Mark as Completed
                      </button>
                    )}
                    
                    {rental.status === "Completed" && viewType === "renter" && !rental.review && (
                      <Link
                        href={`/routes/reviews/new?rentalId=${rental.id}`}
                        className="block w-full py-2 px-4 bg-jacker-orange text-white text-center rounded-md hover:bg-opacity-90"
                      >
                        Leave Review
                      </Link>
                    )}
                  </div>
                  
                  <Link
                    href={`/routes/rentals/${rental.id}`}
                    className="mt-4 block w-full py-2 px-4 bg-gray-100 text-center rounded-md hover:bg-gray-200"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 