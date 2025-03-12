// Add dynamic export to ensure proper data fetching
export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

export default async function ProfilePage() {
  // Ensure user is authenticated
  const user = await requireAuth();
  
  // Fetch user's equipment listings
  const equipment = await db.equipment.findMany({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  
  // Fetch user's rentals (as renter)
  const rentals = await db.rental.findMany({
    where: {
      renterId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    include: {
      equipment: true,
    },
  });
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden">
                {user.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name || "User"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xl font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-medium">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                <p>{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              
              <Link 
                href="/routes/profile/edit" 
                className="block w-full py-2 px-4 bg-gray-100 text-center rounded-md hover:bg-gray-200 transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
        
        {/* User Activity */}
        <div className="md:col-span-2 space-y-8">
          {/* Equipment Listings */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">My Equipment Listings</h2>
              <Link 
                href="/routes/equipment/new" 
                className="text-sm py-2 px-4 bg-black text-white rounded-md hover:bg-opacity-80"
              >
                Add New Equipment
              </Link>
            </div>
            
            {equipment.length === 0 ? (
              <div className="bg-white p-6 rounded-lg border text-center">
                <p className="text-gray-500">You haven't listed any equipment yet.</p>
                <Link 
                  href="/routes/equipment/new" 
                  className="mt-4 inline-block text-sm py-2 px-4 bg-black text-white rounded-md hover:bg-opacity-80"
                >
                  List Your First Equipment
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipment.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            href={`/routes/equipment/${item.id}`}
                            className="font-medium text-black hover:underline"
                          >
                            {item.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.isAvailable 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.dailyRate ? `$${item.dailyRate}/day` : 
                           item.hourlyRate ? `$${item.hourlyRate}/hour` : 
                           item.weeklyRate ? `$${item.weeklyRate}/week` : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            href={`/routes/equipment/${item.id}/edit`}
                            className="text-black hover:underline mr-4"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {equipment.length > 5 && (
                  <div className="px-6 py-3 bg-gray-50 text-right">
                    <Link 
                      href="/routes/profile/equipment"
                      className="text-sm text-black hover:underline"
                    >
                      View All Equipment →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Recent Rentals */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Recent Rentals</h2>
              <Link 
                href="/routes/rentals"
                className="text-sm text-black hover:underline"
              >
                View All Rentals →
              </Link>
            </div>
            
            {rentals.length === 0 ? (
              <div className="bg-white p-6 rounded-lg border text-center">
                <p className="text-gray-500">You haven't rented any equipment yet.</p>
                <Link 
                  href="/routes/equipment"
                  className="mt-4 inline-block text-sm py-2 px-4 bg-black text-white rounded-md hover:bg-opacity-80"
                >
                  Browse Equipment
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rentals.map((rental) => (
                      <tr key={rental.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            href={`/routes/equipment/${rental.equipment.id}`}
                            className="font-medium text-black hover:underline"
                          >
                            {rental.equipment.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            rental.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : rental.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : rental.status === "Completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {rental.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            href={`/routes/rentals/${rental.id}`}
                            className="text-black hover:underline"
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
    </div>
  );
} 