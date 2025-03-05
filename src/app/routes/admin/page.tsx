export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  
  // Check if user is admin
  if (!user || !user.isAdmin) {
    redirect("/");
  }
  
  // Get platform statistics
  const userCount = await db.user.count();
  const equipmentCount = await db.equipment.count();
  const rentalCount = await db.rental.count();
  
  // Get pending moderation count
  const pendingModerationCount = await db.equipment.count({
    where: {
      moderationStatus: "PENDING"
    }
  });
  
  // Get recent rentals
  const recentRentals = await db.rental.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      equipment: true,
      renter: true,
    }
  });
  
  // Get recent users
  const recentUsers = await db.user.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  // Calculate total revenue (simplified)
  const totalRevenue = await db.rental.aggregate({
    _sum: {
      totalPrice: true
    }
  });
  
  // Get rental status counts
  const rentalStatusCounts = await Promise.all([
    db.rental.count({ where: { status: "PENDING" } }),
    db.rental.count({ where: { status: "CONFIRMED" } }),
    db.rental.count({ where: { status: "IN_PROGRESS" } }),
    db.rental.count({ where: { status: "COMPLETED" } }),
    db.rental.count({ where: { status: "CANCELLED" } }),
    db.rental.count({ where: { status: "DISPUTED" } })
  ]);
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Users</h2>
              <p className="text-2xl font-semibold">{userCount}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/routes/admin/users" className="text-sm text-jacker-blue hover:underline">
              View all users →
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Equipment Listings</h2>
              <p className="text-2xl font-semibold">{equipmentCount}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/routes/admin/equipment" className="text-sm text-jacker-blue hover:underline">
              View all equipment →
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Rentals</h2>
              <p className="text-2xl font-semibold">{rentalCount}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/routes/admin/rentals" className="text-sm text-jacker-blue hover:underline">
              View all rentals →
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Revenue</h2>
              <p className="text-2xl font-semibold">{formatCurrency(totalRevenue._sum.totalPrice || 0)}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/routes/admin/payments" className="text-sm text-jacker-blue hover:underline">
              View financials →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <Link 
                href="/routes/admin/equipment?moderationStatus=PENDING" 
                className="flex items-center p-3 bg-yellow-50 text-yellow-800 rounded-md hover:bg-yellow-100"
              >
                <div className="mr-3 bg-yellow-200 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Pending Moderation</p>
                  <p className="text-sm">{pendingModerationCount} items need review</p>
                </div>
              </Link>
              
              <Link 
                href="/routes/admin/rentals?status=DISPUTED" 
                className="flex items-center p-3 bg-red-50 text-red-800 rounded-md hover:bg-red-100"
              >
                <div className="mr-3 bg-red-200 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Disputed Rentals</p>
                  <p className="text-sm">{rentalStatusCounts[5]} rentals in dispute</p>
                </div>
              </Link>
              
              <Link 
                href="/routes/admin/users?verified=false" 
                className="flex items-center p-3 bg-blue-50 text-blue-800 rounded-md hover:bg-blue-100"
              >
                <div className="mr-3 bg-blue-200 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">ID Verification</p>
                  <p className="text-sm">Review user verifications</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Rental Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pending</span>
                <span className="text-sm text-gray-500">{rentalStatusCounts[0]}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${(rentalStatusCounts[0] / rentalCount) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Confirmed</span>
                <span className="text-sm text-gray-500">{rentalStatusCounts[1]}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(rentalStatusCounts[1] / rentalCount) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">In Progress</span>
                <span className="text-sm text-gray-500">{rentalStatusCounts[2]}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(rentalStatusCounts[2] / rentalCount) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Completed</span>
                <span className="text-sm text-gray-500">{rentalStatusCounts[3]}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(rentalStatusCounts[3] / rentalCount) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cancelled</span>
                <span className="text-sm text-gray-500">{rentalStatusCounts[4]}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-gray-500 h-2.5 rounded-full" style={{ width: `${(rentalStatusCounts[4] / rentalCount) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Disputed</span>
                <span className="text-sm text-gray-500">{rentalStatusCounts[5]}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${(rentalStatusCounts[5] / rentalCount) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Admin Tools</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <Link 
                href="/routes/admin/documentation" 
                className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100"
              >
                <div className="mr-3 bg-gray-200 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Documentation</p>
                  <p className="text-sm">View admin documentation</p>
                </div>
              </Link>
              
              <Link 
                href="/routes/admin/reports" 
                className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100"
              >
                <div className="mr-3 bg-gray-200 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Reports</p>
                  <p className="text-sm">Generate financial reports</p>
                </div>
              </Link>
              
              <Link 
                href="/routes/admin/settings" 
                className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100"
              >
                <div className="mr-3 bg-gray-200 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Settings</p>
                  <p className="text-sm">Configure platform settings</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Recent Rentals</h2>
          </div>
          <div className="p-6">
            {recentRentals.length === 0 ? (
              <p className="text-gray-500">No rentals yet</p>
            ) : (
              <div className="space-y-4">
                {recentRentals.map((rental) => (
                  <div key={rental.id} className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md overflow-hidden">
                      {/* Equipment image would go here */}
                      <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs">
                        No Img
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <Link href={`/routes/admin/rentals/${rental.id}`} className="text-sm font-medium text-jacker-blue hover:underline">
                          {rental.equipment.title}
                        </Link>
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
                      <p className="text-xs text-gray-500">
                        Rented by {rental.renter.name} • {new Date(rental.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-right">
              <Link href="/routes/admin/rentals" className="text-sm text-jacker-blue hover:underline">
                View all rentals →
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">New Users</h2>
          </div>
          <div className="p-6">
            {recentUsers.length === 0 ? (
              <p className="text-gray-500">No users yet</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
                      {/* User avatar would go here */}
                      <div className="h-full w-full flex items-center justify-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <Link href={`/routes/admin/users/${user.id}`} className="text-sm font-medium text-jacker-blue hover:underline">
                        {user.name || 'Unnamed User'}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {user.email} • Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-right">
              <Link href="/routes/admin/users" className="text-sm text-jacker-blue hover:underline">
                View all users →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 