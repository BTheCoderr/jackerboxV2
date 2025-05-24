import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils/format";
import { Calendar, DollarSign, Package, Bell, User, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { ErrorMessage } from "@/components/dashboard/error-message";

export const metadata: Metadata = {
  title: "Dashboard | Jackerbox",
  description: "Manage your Jackerbox account",
};

export const dynamic = 'force-dynamic';

// Define the extended user type that includes userType
interface ExtendedUser {
  id: string;
  name: string | null;
  email: string;
  userType?: string;
  [key: string]: any; // Allow other properties
}

export default async function DashboardPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ error?: string }> 
}) {
  const user = await getCurrentUser() as ExtendedUser;

  if (!user) {
    redirect("/auth/login?callbackUrl=/routes/dashboard");
  }

  // In Next.js 15+, searchParams must be awaited before accessing properties
  const searchParamsData = await searchParams;
  const errorParam: string | undefined = typeof searchParamsData.error === 'string' ? searchParamsData.error : undefined;

  try {
    // Fetch user's rentals (as a renter)
    const rentals = await db.rental.findMany({
      where: {
        renterId: user.id,
        status: "ACTIVE",
      },
      orderBy: {
        startDate: "desc",
      },
      take: 5,
      include: {
        equipment: {
          select: {
            title: true,
            id: true
          }
        }
      }
    });

    // Fetch user's equipment listings (as an owner)
    const equipment = await db.equipment.findMany({
      where: {
        ownerId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Fetch rentals of user's equipment (as an owner)
    const equipmentRentals = await db.rental.findMany({
      where: {
        equipment: {
          ownerId: user.id
        },
        status: "ACTIVE"
      },
      orderBy: {
        startDate: "desc"
      },
      take: 5,
      include: {
        equipment: {
          select: {
            title: true,
            id: true
          }
        },
        renter: {
          select: {
            name: true,
            id: true
          }
        }
      }
    });

    // Fetch user's unread notifications
    const unreadNotifications = await db.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    // Calculate total earnings as an owner
    const payments = await db.payment.findMany({
      where: {
        rental: {
          equipment: {
            ownerId: user.id,
          },
        },
        status: "COMPLETED",
      },
      select: {
        amount: true,
      },
    });

    const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate total spent as a renter
    const rentPayments = await db.payment.findMany({
      where: {
        rental: {
          renterId: user.id,
        },
        status: "COMPLETED",
      },
      select: {
        amount: true,
      },
    });

    const totalSpent = rentPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Check if user is both a renter and an owner
    const isRenter = rentals.length > 0 || rentPayments.length > 0;
    const isOwner = equipment.length > 0 || payments.length > 0;
    
    // Get user type from database
    const userType = user.userType || "both";

    // Determine which section to show by default based on user type
    const showRenterByDefault = userType === "renter" || userType === "both";
    const showOwnerByDefault = userType === "owner" || userType === "both";

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {/* User Role Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
          <div className="mr-3 mt-1">
            <User className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-medium text-blue-700">Your Account Type: {userType.charAt(0).toUpperCase() + userType.slice(1)}</h3>
            {userType === "renter" && (
              <p className="text-sm text-blue-600 mt-1">
                You're currently set up as a renter. You can browse and rent equipment from others.
                {" "}
                <Link href="/routes/profile/settings" className="underline">
                  Want to list your own equipment? Update your profile.
                </Link>
              </p>
            )}
            {userType === "owner" && (
              <p className="text-sm text-blue-600 mt-1">
                You're currently set up as an equipment owner. You can list your equipment for others to rent.
                {" "}
                <Link href="/routes/profile/settings" className="underline">
                  Need to rent equipment? Update your profile.
                </Link>
              </p>
            )}
            {userType === "both" && (
              <p className="text-sm text-blue-600 mt-1">
                You can both rent equipment and list your own equipment for others to rent.
              </p>
            )}
          </div>
        </div>

        {/* Error Messages - Using Client Component */}
        <ErrorMessage error={errorParam} userType={userType} />

        {/* Role Selection Tabs - Using Client Component */}
        <DashboardTabs 
          initialRenterTab={showRenterByDefault} 
          initialOwnerTab={showOwnerByDefault} 
        />

        {/* Renter Section */}
        <div id="renter-section" className={`mb-10 ${showRenterByDefault ? '' : 'hidden'}`}>
          {userType === "owner" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Note:</span> Your account is set as an "owner" account. To rent equipment, 
                <Link href="/routes/profile/settings" className="underline ml-1">update your profile</Link> to be a "renter" or "both".
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Renter Stats */}
            <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full mr-4 bg-blue-50 text-blue-700">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Rentals</p>
                  <p className="text-2xl font-bold">{rentals.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full mr-4 bg-red-50 text-red-700">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full mr-4 bg-yellow-50 text-yellow-700">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Notifications</p>
                  <p className="text-2xl font-bold">{unreadNotifications}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Rentals as Renter */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Your Recent Rentals</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {rentals.length > 0 ? (
                rentals.map((rental) => (
                  <Link
                    key={rental.id}
                    href={`/routes/rentals/${rental.id}`}
                    className="block px-6 py-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{rental.equipment.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            rental.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : rental.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : rental.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {rental.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatCurrency(rental.totalPrice)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  You haven't rented any equipment yet
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <Link
                href="/routes/equipment"
                className="text-sm text-blue-600 hover:underline"
              >
                Browse equipment to rent
              </Link>
            </div>
          </div>
        </div>

        {/* Owner Section */}
        <div id="owner-section" className={`mb-10 ${!showRenterByDefault && showOwnerByDefault ? '' : 'hidden'}`}>
          {userType === "renter" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Note:</span> Your account is set as a "renter" account. To list equipment, 
                <Link href="/routes/profile/settings" className="underline ml-1">update your profile</Link> to be an "owner" or "both".
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Owner Stats */}
            <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full mr-4 bg-purple-50 text-purple-700">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Your Equipment</p>
                  <p className="text-2xl font-bold">{equipment.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full mr-4 bg-green-50 text-green-700">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full mr-4 bg-blue-50 text-blue-700">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Bookings</p>
                  <p className="text-2xl font-bold">{equipmentRentals.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Your Equipment */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Your Equipment</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {equipment.length > 0 ? (
                equipment.map((item) => (
                  <Link
                    key={item.id}
                    href={`/routes/equipment/${item.id}`}
                    className="block px-6 py-4 hover:bg-gray-50"
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
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  You haven't listed any equipment yet
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              {userType === "owner" || userType === "both" ? (
                <Link
                  href="/routes/equipment/new"
                  className="text-sm text-blue-600 hover:underline"
                >
                  List new equipment
                </Link>
              ) : (
                <Link
                  href="/routes/profile/settings"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Update profile to list equipment
                </Link>
              )}
            </div>
          </div>

          {/* Bookings for Your Equipment */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Recent Bookings</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {equipmentRentals.length > 0 ? (
                equipmentRentals.map((rental) => (
                  <Link
                    key={rental.id}
                    href={`/routes/rentals/${rental.id}`}
                    className="block px-6 py-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{rental.equipment.title}</p>
                        <p className="text-sm text-gray-500">
                          Rented by: {rental.renter.name || "User"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            rental.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : rental.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : rental.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {rental.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatCurrency(rental.totalPrice)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  No bookings for your equipment yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* First-time User Guidance */}
        {!isRenter && !isOwner && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Welcome to Jackerbox!</h2>
            <p className="text-gray-600 mb-6">
              You can use Jackerbox as a renter, an owner, or both. Choose how you'd like to get started:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <User className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-medium mb-2">Rent Equipment</h3>
                <p className="text-gray-500 mb-4">
                  Browse and rent equipment from other users for your projects.
                </p>
                <Link
                  href="/routes/equipment"
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Browse Equipment
                </Link>
              </div>
              <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">List Your Equipment</h3>
                <p className="text-gray-500 mb-4">
                  Earn money by renting out your equipment to others.
                </p>
                {userType === "renter" ? (
                  <Link
                    href="/routes/profile/settings"
                    className="inline-block px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Update Profile to List
                  </Link>
                ) : (
                  <Link
                    href="/routes/equipment/new"
                    className="inline-block px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    List Equipment
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-700 font-medium">Error loading dashboard</h2>
          <p className="text-red-600 mt-1">There was a problem loading your dashboard. Please try again later.</p>
        </div>
      </div>
    );
  }
} 