"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { NotificationDropdownWrapper } from "../notifications/notification-dropdown-wrapper";
import { LogoutButton } from "../auth/logout-button";
import { MessageCircle, Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "../theme/theme-toggle";
import { resetAuthCookies } from "@/lib/auth/session-reset";
import { toast } from 'sonner';
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleResetSession = () => {
    resetAuthCookies();
    toast("Session reset", {
      description: "Auth cookies have been cleared. Please refresh the page.",
      duration: 5000
    });
  };
  
  return (
    <header className="border-b hidden md:block">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/routes/equipment" className="text-gray-600 hover:text-jacker-blue dark:text-gray-300">
              Browse Equipment
            </Link>
            <Link href="/routes/how-it-works" className="text-gray-600 hover:text-jacker-blue dark:text-gray-300">
              How It Works
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link 
                href="/routes/equipment/new"
                className="px-4 py-2 border border-jacker-blue text-jacker-blue rounded-md hover:bg-jacker-blue hover:text-white transition-colors dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400"
              >
                List Equipment
              </Link>
              
              <button
                onClick={() => {
                  window.location.href = "/routes/messages";
                }}
                className="p-2 text-gray-600 hover:text-jacker-blue rounded-full dark:text-gray-300"
                title="Messages"
              >
                <MessageCircle size={20} />
              </button>
              
              <NotificationDropdownWrapper />
              
              <ThemeToggle />
              
              <div className="relative">
                <Link href="/routes/profile" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-jacker-blue rounded-full flex items-center justify-center text-white">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <span className="hidden md:inline">{user.name}</span>
                </Link>
              </div>
              
              {/* Desktop Hamburger Menu for Additional Options */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-gray-600 hover:text-jacker-blue rounded-full dark:text-gray-300"
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                >
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                    <div className="py-2">
                      <Link 
                        href="/routes/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/routes/profile/settings"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      
                      {user.isAdmin && (
                        <>
                          <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
                          <Link 
                            href="/routes/admin"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Admin Panel
                          </Link>
                          <Link 
                            href="/routes/feature-flags"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Feature Flags
                          </Link>
                          <button
                            onClick={() => {
                              handleResetSession();
                              setIsMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Reset Auth Cookies
                          </button>
                        </>
                      )}
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
                      <div className="px-4 py-2">
                        <LogoutButton />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <ThemeToggle />
              
              <Link 
                href="/auth/login"
                className="px-4 py-2 hover:text-jacker-blue rounded-md dark:text-gray-300"
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