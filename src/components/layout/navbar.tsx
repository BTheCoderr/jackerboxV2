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
                <Link 
                  href="/routes/admin"
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                >
                  Admin
                </Link>
              )}
              
              <button
                onClick={() => window.location.href = "/routes/messages"}
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