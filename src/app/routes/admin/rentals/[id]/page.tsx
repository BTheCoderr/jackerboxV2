// Add dynamic export to ensure proper server-side rendering
export const dynamic = 'force-dynamic';

import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper function to format dates
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface AdminRentalDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminRentalDetailPage({ params }: AdminRentalDetailPageProps) {
  const user = await getCurrentUser();
  
  if (!user?.isAdmin) {
    throw new Error("Unauthorized");
  }
  
  // Get rental with related data
  const rental = await db.rental.findUnique({
    where: {
      id: params.id,
    },
    include: {
      equipment: true,
      renter: true,
    },
  });
  
  if (!rental) {
    notFound();
  }
  
  // Get equipment owner
  const equipment = await db.equipment.findUnique({
    where: {
      id: rental.equipmentId,
    },
    include: {
      owner: true,
    },
  });
  
  if (!equipment) {
    notFound();
  }
  
  // Calculate rental duration in days
  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);
  const durationInMs = endDate.getTime() - startDate.getTime();
  const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
  
  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/routes/admin/rentals" className="text-jacker-blue hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Rentals
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rental Details</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-blue-700">
            Download Invoice
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Rental Overview */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Rental Overview</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Rental ID</h3>
                  <p className="mt-1 text-sm text-gray-900">{rental.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      rental.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      rental.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                      rental.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' :
                      rental.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      rental.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {rental.status}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(rental.startDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(rental.endDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                  <p className="mt-1 text-sm text-gray-900">{durationInDays} days</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(rental.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Equipment Details */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Equipment Details</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-24 w-24 bg-gray-200 rounded-md overflow-hidden">
                  {/* Equipment image would go here */}
                  <div className="h-full w-full flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium">
                    <Link href={`/routes/admin/equipment/${equipment.id}`} className="text-jacker-blue hover:underline">
                      {equipment.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Category: {equipment.category || 'Uncategorized'}
                  </p>
                  <div className="mt-2">
                    <Link href={`/routes/admin/users/${equipment.owner.id}`} className="text-jacker-blue hover:underline text-sm">
                      Owner: {equipment.owner.name}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Renter Details */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Renter Details</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full overflow-hidden">
                  {/* Renter avatar would go here */}
                  <div className="h-full w-full flex items-center justify-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">
                    <Link href={`/routes/admin/users/${rental.renter.id}`} className="text-jacker-blue hover:underline">
                      {rental.renter.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{rental.renter.email}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    ID Verification: {rental.renter.idVerified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Admin Actions */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Admin Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Update Rental Status</h3>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      onClick={() => {
                        // This would be connected to a client component in a real implementation
                        console.log('Update status to CONFIRMED');
                      }}
                    >
                      Confirm
                    </button>
                    <button 
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                      onClick={() => {
                        console.log('Update status to IN_PROGRESS');
                      }}
                    >
                      Mark In Progress
                    </button>
                    <button 
                      className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                      onClick={() => {
                        console.log('Update status to COMPLETED');
                      }}
                    >
                      Complete
                    </button>
                    <button 
                      className="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                      onClick={() => {
                        console.log('Update status to CANCELLED');
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                      onClick={() => {
                        console.log('Update status to DISPUTED');
                      }}
                    >
                      Mark Disputed
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Add Admin Note</h3>
                  <div className="flex gap-2">
                    <textarea 
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-jacker-blue focus:ring-jacker-blue"
                      rows={3}
                      placeholder="Add a note about this rental..."
                    ></textarea>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button className="px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-blue-700">
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Payment Details</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Rental Fee</span>
                  <span className="text-sm font-medium">{formatCurrency(rental.totalPrice)}</span>
                </div>
                {rental.securityDeposit && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Security Deposit</span>
                    <span className="text-sm font-medium">{formatCurrency(rental.securityDeposit)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Platform Fee</span>
                  <span className="text-sm font-medium">{formatCurrency(rental.totalPrice * 0.1)}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(rental.totalPrice + (rental.securityDeposit || 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Renter
                </button>
                <button className="w-full px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Owner
                </button>
                <button 
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
                  onClick={() => {
                    // This would be connected to a client component in a real implementation
                    if (confirm('Are you sure you want to delete this rental? This action cannot be undone.')) {
                      console.log('Delete rental');
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Rental
                </button>
              </div>
            </div>
          </div>
          
          {/* Rental Timeline */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Rental Timeline</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="relative pl-8 pb-6 border-l-2 border-gray-200">
                  <div className="absolute -left-2 mt-0.5 w-4 h-4 rounded-full bg-green-500"></div>
                  <p className="font-medium">Rental Created</p>
                  <p className="text-sm text-gray-500">{formatDate(rental.createdAt)}</p>
                </div>
                
                <div className="relative pl-8 pb-6 border-l-2 border-gray-200">
                  <div className="absolute -left-2 mt-0.5 w-4 h-4 rounded-full bg-gray-300"></div>
                  <p className="font-medium">Rental Start</p>
                  <p className="text-sm text-gray-500">{formatDate(rental.startDate)}</p>
                </div>
                
                <div className="relative pl-8">
                  <div className="absolute -left-2 mt-0.5 w-4 h-4 rounded-full bg-gray-300"></div>
                  <p className="font-medium">Rental End</p>
                  <p className="text-sm text-gray-500">{formatDate(rental.endDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 