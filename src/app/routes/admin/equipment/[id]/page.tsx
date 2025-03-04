import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EquipmentModerationForm } from "@/components/admin/equipment-moderation-form";

interface AdminEquipmentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminEquipmentDetailPage({ params }: AdminEquipmentDetailPageProps) {
  const user = await getCurrentUser();
  
  if (!user?.isAdmin) {
    throw new Error("Unauthorized");
  }
  
  const equipment = await db.equipment.findUnique({
    where: {
      id: params.id,
    },
    include: {
      owner: true,
    },
  });
  
  if (!equipment) {
    notFound();
  }
  
  // Parse images from JSON string
  const images = equipment.imagesJson ? JSON.parse(equipment.imagesJson) : [];
  
  // Get recent rentals for this equipment
  const recentRentals = await db.rental.findMany({
    where: {
      equipmentId: equipment.id,
    },
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      renter: true,
    },
  });
  
  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/routes/admin/equipment" className="text-jacker-blue hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Equipment
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{equipment.title}</h1>
        <div className="flex gap-2">
          <Link 
            href={`/routes/equipment/${equipment.id}`} 
            className="px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-blue-700"
            target="_blank"
          >
            View Public Listing
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Equipment Overview */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Equipment Overview</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/3 mb-4 md:mb-0 md:mr-6">
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
                    {images.length > 0 ? (
                      <img 
                        src={images[0]} 
                        alt={equipment.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {images.slice(1, 4).map((image: string, index: number) => (
                        <div key={index} className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
                          <img 
                            src={image} 
                            alt={`${equipment.title} ${index + 2}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-full md:w-2/3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Category</h3>
                      <p className="mt-1 text-sm text-gray-900">{equipment.category}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Condition</h3>
                      <p className="mt-1 text-sm text-gray-900">{equipment.condition}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Location</h3>
                      <p className="mt-1 text-sm text-gray-900">{equipment.location}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Daily Rate</h3>
                      <p className="mt-1 text-sm text-gray-900">${equipment.dailyRate}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                      <p className="mt-1 text-sm text-gray-900">{new Date(equipment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                      <p className="mt-1 text-sm text-gray-900">{new Date(equipment.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1 text-sm text-gray-900">{equipment.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Owner Information */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Owner Information</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full overflow-hidden">
                  {equipment.owner.image ? (
                    <img 
                      src={equipment.owner.image} 
                      alt={equipment.owner.name || "Owner"} 
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">
                    <Link href={`/routes/admin/users/${equipment.owner.id}`} className="text-jacker-blue hover:underline">
                      {equipment.owner.name || "Unnamed User"}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500">{equipment.owner.email}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Rentals */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Recent Rentals</h2>
            </div>
            <div className="p-6">
              {recentRentals.length === 0 ? (
                <p className="text-gray-500">No rental history for this equipment</p>
              ) : (
                <div className="space-y-4">
                  {recentRentals.map((rental) => (
                    <div key={rental.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
                          {rental.renter.image ? (
                            <img 
                              src={rental.renter.image} 
                              alt={rental.renter.name || "Renter"} 
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <Link href={`/routes/admin/rentals/${rental.id}`} className="text-sm font-medium text-jacker-blue hover:underline">
                            Rental #{rental.id.substring(0, 8)}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        rental.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        rental.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                        rental.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' :
                        rental.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        rental.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {rental.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div>
          {/* Moderation Form */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Moderation</h2>
            </div>
            <div className="p-6">
              <EquipmentModerationForm 
                equipment={{
                  id: equipment.id,
                  title: equipment.title,
                  moderationStatus: equipment.moderationStatus || 'PENDING',
                  moderationNotes: equipment.moderationNotes
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 