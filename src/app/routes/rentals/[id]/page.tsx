import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { formatCurrency, formatDateRange } from "@/lib/utils/format";
import { RentalActions } from "@/components/rentals/rental-actions";

interface RentalDetailPageProps {
  params: {
    id: string;
  };
}

export default async function RentalDetailPage({ params }: RentalDetailPageProps) {
  // Ensure user is authenticated
  const user = await requireAuth();
  
  // Fetch the rental
  const rental = await db.rental.findUnique({
    where: {
      id: params.id,
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
  
  // If rental doesn't exist or user is not involved, redirect
  if (!rental || (rental.renterId !== user.id && rental.equipment.ownerId !== user.id)) {
    redirect("/routes/rentals");
  }
  
  // Determine if user is the owner or renter
  const isOwner = rental.equipment.ownerId === user.id;
  const otherParty = isOwner ? rental.renter : rental.equipment.owner;
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/routes/rentals" className="text-black hover:underline flex items-center">
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Rentals
        </Link>
      </div>
      
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold">Rental Details</h1>
            <span
              className={`px-3 py-1 text-sm rounded-full ${
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* Equipment Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-medium mb-4">Equipment</h2>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="sm:w-1/3">
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
                <div className="sm:w-2/3">
                  <Link
                    href={`/routes/equipment/${rental.equipment.id}`}
                    className="text-lg font-medium hover:underline"
                  >
                    {rental.equipment.title}
                  </Link>
                  
                  <p className="text-gray-600 mt-2">{rental.equipment.description}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center">
                      <span className="text-gray-600 w-32">Category:</span>
                      <span>{rental.equipment.category}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 w-32">Condition:</span>
                      <span>{rental.equipment.condition}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 w-32">Location:</span>
                      <span>{rental.equipment.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h2 className="text-xl font-medium mb-4">Rental Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-600">Rental Period</h3>
                  <p className="mt-1">
                    {formatDateRange(rental.startDate, rental.endDate)}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-600">Total Price</h3>
                  <p className="mt-1 font-medium">
                    {formatCurrency(rental.totalPrice)}
                  </p>
                </div>
                {rental.securityDeposit && (
                  <div>
                    <h3 className="font-medium text-gray-600">Security Deposit</h3>
                    <p className="mt-1">
                      {formatCurrency(rental.securityDeposit)}
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-600">Payment Status</h3>
                  <p className="mt-1">
                    {rental.payment ? (
                      <span className="text-green-600">Paid</span>
                    ) : (
                      <span className="text-red-600">Unpaid</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Review Section */}
            {rental.status === "Completed" && !rental.review && !isOwner && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-medium mb-4">Leave a Review</h2>
                <Link
                  href={`/routes/rentals/${rental.id}/review`}
                  className="inline-block px-4 py-2 bg-black text-white rounded-md hover:bg-opacity-80"
                >
                  Write a Review
                </Link>
              </div>
            )}
            
            {rental.review && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-medium mb-4">Review</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 ${
                            star <= rental.review.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-gray-600">
                        {rental.review.rating}/5
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700">{rental.review.comment}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(rental.review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Other Party Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">
                {isOwner ? "Renter" : "Owner"} Information
              </h3>
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    {otherParty.image ? (
                      <img
                        src={otherParty.image}
                        alt={otherParty.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xl font-bold">
                        {otherParty.name
                          ? otherParty.name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-medium">{otherParty.name || "User"}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <Link
                  href={`/routes/messages/${rental.id}`}
                  className="block w-full py-2 px-4 bg-gray-100 text-center rounded-md hover:bg-gray-200 transition-colors"
                >
                  Message {isOwner ? "Renter" : "Owner"}
                </Link>
              </div>
            </div>
            
            {/* Actions */}
            <RentalActions rental={rental} isOwner={isOwner} />
          </div>
        </div>
      </div>
    </div>
  );
} 