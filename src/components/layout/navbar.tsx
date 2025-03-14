"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { NotificationDropdownWrapper } from "../notifications/notification-dropdown-wrapper";
import { LogoutButton } from "../auth/logout-button";
import { MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  
  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/routes/equipment" className="text-gray-600 hover:text-jacker-blue">
              Browse Equipment
            </Link>
            <Link href="/routes/how-it-works" className="text-gray-600 hover:text-jacker-blue">
              How It Works
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link 
                href="/routes/equipment/new"
                className="px-4 py-2 border border-jacker-blue text-jacker-blue rounded-md hover:bg-jacker-blue hover:text-white transition-colors"
              >
                List Equipment
              </Link>
              
              {user.isAdmin && (
                <>
                  <Link 
                    href="/routes/admin"
                    className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                  >
                    Admin
                  </Link>
                  
                  <Link 
                    href="/routes/feature-flags"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Feature Flags
                  </Link>
                  
                  <div className="relative group">
                    <button
                      className="px-4 py-2 bg-purple-800 text-white rounded-md hover:bg-purple-700"
                    >
                      Debug
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200 hidden group-hover:block">
                      <Link
                        href="/routes/debug/navigation"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Navigation Debug
                      </Link>
                      <Link
                        href="/routes/debug/socket-test"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Socket Debug
                      </Link>
                      <Link
                        href="/routes/debug/socket"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Socket Status
                      </Link>
                      <Link
                        href="/routes/reviews/sample"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Review System Demo
                      </Link>
                      <Link
                        href="/routes/pricing/demo"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Dynamic Pricing Demo
                      </Link>
                      <Link
                        href="/routes/verification/demo"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ID Verification Demo
                      </Link>
                    </div>
                  </div>
                </>
              )}
              
              <button
                onClick={() => {
                  window.location.href = "/routes/messages";
                }}
                className="p-2 text-gray-600 hover:text-jacker-blue rounded-full"
                title="Messages"
              >
                <MessageCircle size={20} />
              </button>
              
              <NotificationDropdownWrapper />
              
              <div className="relative">
                <Link href="/routes/profile" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-jacker-blue rounded-full flex items-center justify-center text-white">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <span className="hidden md:inline">{user.name}</span>
                </Link>
              </div>
              
              <LogoutButton />
            </>
          ) : (
            <>
              <Link 
                href="/auth/login"
                className="px-4 py-2 hover:text-jacker-blue rounded-md"
              >
                Log in
              </Link>
              <Link 
                href="/auth/register"
                className="px-4 py-2 bg-jacker-orange text-white rounded-md hover:bg-opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 