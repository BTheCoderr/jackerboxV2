import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils/format";
import { Calendar, DollarSign, Package, Bell } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard | Jackerbox",
  description: "Manage your Jackerbox account",
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?callbackUrl=/routes/dashboard");
  }

  try {
    // Fetch user's rentals
    const rentals = await db.rental.findMany({
      where: {
        renterId: user.id,
        status: "ACTIVE",
      },
      orderBy: {
        startDate: "desc",
      },
      take: 5,
    });

    // Fetch user's equipment listings
    const equipment = await db.equipment.findMany({
      where: {
        ownerId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Fetch user's unread notifications
    const unreadNotifications = await db.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    // Calculate total earnings
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

    // Dashboard cards data
    const dashboardCards = [
      {
        title: "Active Rentals",
        value: rentals.length,
        icon: Calendar,
        href: "/routes/dashboard/rentals",
        color: "bg-blue-50 text-blue-700",
      },
      {
        title: "Total Earnings",
        value: formatCurrency(totalEarnings),
        icon: DollarSign,
        href: "/routes/dashboard/earnings",
        color: "bg-green-50 text-green-700",
      },
      {
        title: "Your Equipment",
        value: equipment.length,
        icon: Package,
        href: "/routes/dashboard/equipment",
        color: "bg-purple-50 text-purple-700",
      },
      {
        title: "Notifications",
        value: unreadNotifications,
        icon: Bell,
        href: "/routes/dashboard/notifications",
        color: "bg-yellow-50 text-yellow-700",
      },
    ];

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {dashboardCards.map((card) => {
            return (
              <Link
                key={card.title}
                href={card.href}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-center">
                  <div
                    className={`p-3 rounded-full mr-4 ${card.color}`}
                  >
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Rentals */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Recent Rentals</h2>
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
                        <p className="font-medium">
                          {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(rental.totalPrice)}
                        </p>
                      </div>
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
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  You have no recent rentals
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <Link
                href="/routes/dashboard/rentals"
                className="text-sm text-blue-600 hover:underline"
              >
                View all rentals
              </Link>
            </div>
          </div>

          {/* Your Equipment */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  You have no equipment listed
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <Link
                href="/routes/equipment/new"
                className="text-sm text-blue-600 hover:underline"
              >
                List new equipment
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-500">Error loading dashboard data. Please try again later.</p>
          <Link href="/routes/equipment" className="mt-4 inline-block text-blue-600 hover:underline">
            Browse Equipment
          </Link>
        </div>
      </div>
    );
  }
} 