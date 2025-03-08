import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home as HomeIcon, Calendar as CalendarIcon, MessageSquare as ChatBubbleLeftIcon, Bell as BellIcon, Plus as PlusCircleIcon, Package as CubeIcon, Banknote as BanknotesIcon, Settings as Cog6ToothIcon, User as UserCircleIcon, LogOut as ArrowRightOnRectangleIcon } from "lucide-react";

function StripeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M7 15h10M9 9h6M7 12h10" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Dashboard | Jackerbox",
  description: "Manage your Jackerbox account",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-white border-r border-gray-200 md:min-h-screen">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Dashboard</h2>
          </div>
          
          {/* Renter Navigation */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Renter
            </h3>
            <nav className="space-y-2">
              <Link
                href="/routes/dashboard"
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
              >
                <HomeIcon className="mr-3 h-5 w-5 text-gray-500" />
                <span>Overview</span>
              </Link>
              <Link
                href="/routes/dashboard/rentals"
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
              >
                <CalendarIcon className="mr-3 h-5 w-5 text-gray-500" />
                <span>My Rentals</span>
              </Link>
              <Link
                href="/routes/messages"
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
              >
                <ChatBubbleLeftIcon className="mr-3 h-5 w-5 text-gray-500" />
                <span>Messages</span>
              </Link>
              <Link
                href="/routes/dashboard/notifications"
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
              >
                <BellIcon className="mr-3 h-5 w-5 text-gray-500" />
                <span>Notifications</span>
              </Link>
            </nav>
          </div>
          
          {/* Owner Navigation */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Owner
            </h3>
            <nav className="space-y-2">
              <Link
                href="/routes/equipment/new"
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
              >
                <PlusCircleIcon className="mr-3 h-5 w-5 text-gray-500" />
                <span>List Equipment</span>
              </Link>
              <Link
                href="/routes/dashboard/equipment"
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
              >
                <CubeIcon className="mr-3 h-5 w-5 text-gray-500" />
                <span>My Equipment</span>
              </Link>
              <Link
                href="/routes/dashboard/earnings"
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
              >
                <BanknotesIcon className="mr-3 h-5 w-5 text-gray-500" />
                <span>Earnings</span>
              </Link>
              <Link
                href="/routes/dashboard/stripe-connect"
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
              >
                <StripeIcon className="mr-3 h-5 w-5 text-gray-500" />
                <span>Stripe Connect</span>
              </Link>
            </nav>
          </div>
          
          {/* Account Settings */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Account
            </h3>
            <nav className="space-y-2">
              <Link
                href="/routes/dashboard/settings"
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
              >
                <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-500" />
                <span>Settings</span>
              </Link>
              <Link
                href="/routes/dashboard/profile"
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
              >
                <UserCircleIcon className="mr-3 h-5 w-5 text-gray-500" />
                <span>Profile</span>
              </Link>
              <Link
                href="/auth/logout"
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-500" />
                <span>Logout</span>
              </Link>
            </nav>
          </div>
        </aside>
        
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
} 