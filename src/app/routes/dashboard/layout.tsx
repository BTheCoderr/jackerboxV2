import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, CreditCard, Bell, Settings, User, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Dashboard | Jackerbox",
  description: "Manage your Jackerbox account",
};

// Custom Stripe icon component
function StripeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14.5 9.5C14.5 11.0294 13.0294 12 11.5 12C9.97056 12 8.5 11.0294 8.5 9.5C8.5 7.97056 9.97056 7 11.5 7C13.0294 7 14.5 7.97056 14.5 9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M14.5 14.5C14.5 16.0294 13.0294 17 11.5 17C9.97056 17 8.5 16.0294 8.5 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 14.5V9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14.5 14.5V9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if the user is an equipment owner
  const equipmentCount = await db.equipment.count({
    where: {
      ownerId: user.id
    }
  });

  const isEquipmentOwner = equipmentCount > 0;

  const navItems = [
    {
      label: "Dashboard",
      href: "/routes/dashboard",
      icon: Home,
    },
    {
      label: "Rentals",
      href: "/routes/dashboard/rentals",
      icon: CreditCard,
    },
    {
      label: "Messages",
      href: "/routes/messages",
      icon: MessageCircle,
    },
    {
      label: "Notifications",
      href: "/routes/dashboard/notifications",
      icon: Bell,
    },
    {
      label: "Profile",
      href: "/routes/profile",
      icon: User,
    },
    {
      label: "Settings",
      href: "/routes/dashboard/settings",
      icon: Settings,
    },
  ];

  // Add Stripe Connect link if the user is an equipment owner
  if (isEquipmentOwner) {
    navItems.push({
      label: "Stripe Connect",
      href: "/routes/dashboard/stripe-connect",
      icon: StripeIcon,
    });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
          <div className="px-4 pb-2 text-xl font-semibold">
            <h2>Dashboard</h2>
          </div>
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 group"
                >
                  <Icon className="w-5 h-5 mr-3 text-gray-500" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
} 