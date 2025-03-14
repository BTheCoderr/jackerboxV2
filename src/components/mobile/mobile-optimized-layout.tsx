"use client";

import { useState, useEffect, ReactNode } from "react";
import { Menu, X, ChevronLeft, Home, MessageSquare, Search, User, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileOptimizedLayoutProps {
  children: ReactNode;
}

export function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname() || "/";
  
  useEffect(() => {
    // Check if the device is mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  // If not mobile, just render children
  if (!isMobile) {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            {pathname !== "/" && (
              <button
                onClick={() => window.history.back()}
                className="mr-3 p-1 rounded-full hover:bg-gray-100"
                aria-label="Go back"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <Link href="/" className="font-bold text-xl">
              Jackerbox
            </Link>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <nav className="p-4">
              <ul className="space-y-4">
                <li>
                  <Link
                    href="/"
                    className="flex items-center text-gray-700 hover:text-black"
                  >
                    <Home className="mr-3" size={20} />
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/routes/equipment"
                    className="flex items-center text-gray-700 hover:text-black"
                  >
                    <Search className="mr-3" size={20} />
                    Browse Equipment
                  </Link>
                </li>
                <li>
                  <Link
                    href="/routes/messages"
                    className="flex items-center text-gray-700 hover:text-black"
                  >
                    <MessageSquare className="mr-3" size={20} />
                    Messages
                  </Link>
                </li>
                <li>
                  <Link
                    href="/routes/profile"
                    className="flex items-center text-gray-700 hover:text-black"
                  >
                    <User className="mr-3" size={20} />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/routes/settings"
                    className="flex items-center text-gray-700 hover:text-black"
                  >
                    <Settings className="mr-3" size={20} />
                    Settings
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1 pb-16">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === "/" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link
            href="/routes/equipment"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname.startsWith("/routes/equipment") ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <Search size={20} />
            <span className="text-xs mt-1">Search</span>
          </Link>
          
          <Link
            href="/routes/messages"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname.startsWith("/routes/messages") ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <MessageSquare size={20} />
            <span className="text-xs mt-1">Messages</span>
          </Link>
          
          <Link
            href="/routes/profile"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname.startsWith("/routes/profile") ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <User size={20} />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
} 