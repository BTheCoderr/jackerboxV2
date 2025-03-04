import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Calendar, DollarSign, Package, Bell } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard | Jackerbox",
  description: "Manage your Jackerbox account",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user's rentals
  const rentals = await db.rental.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Get user's equipment
  const equipment = await db.equipment.findMany({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Get user's unread notifications count
  const unreadNotificationsCount = await db.notification.count({
    where: {
      userId: user.id,
      read: false,
    },
  });

  // Calculate total earnings (simplified)
  const totalEarnings = await db.payment.aggregate({
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

  const dashboardCards = [
    {
      title: "Active Rentals",
      value: rentals.filter(rental => rental.status === "ACTIVE").length,
      icon: Calendar,
      href: "/routes/dashboard/rentals",
      color: "bg-blue-500",
    },
    {
      title: "Total Earnings",
      value: `$${totalEarnings._sum.ownerPaidOutAmount?.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      href: "/routes/dashboard/earnings",
      color: "bg-green-500",
    },
    {
      title: "Equipment Listed",
      value: equipment.length,
      icon: Package,
      href: "/routes/dashboard/equipment",
      color: "bg-purple-500",
    },
    {
      title: "Notifications",
      value: unreadNotificationsCount,
      icon: Bell,
      href: "/routes/dashboard/notifications",
      color: "bg-yellow-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${card.color} text-white mr-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-semibold">{card.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Rentals</h2>
          {rentals.length === 0 ? (
            <p className="text-gray-500">No rentals yet</p>
          ) : (
            <div className="space-y-4">
              {rentals.map((rental) => (
                <Link
                  key={rental.id}
                  href={`/routes/rentals/${rental.id}`}
                  className="block p-4 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{rental.equipmentId}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rental.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                        rental.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                        rental.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {rental.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Your Equipment</h2>
          {equipment.length === 0 ? (
            <div>
              <p className="text-gray-500 mb-4">You haven't listed any equipment yet</p>
              <Link
                href="/routes/equipment/new"
                className="inline-block px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-opacity-90"
              >
                List Equipment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {equipment.map((item) => (
                <Link
                  key={item.id}
                  href={`/routes/equipment/${item.id}`}
                  className="block p-4 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">${item.pricePerDay}/day</p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {item.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 