"use client";

import { useState, useEffect, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileBottomNav } from "./mobile-bottom-nav";

interface MobileOptimizedLayoutProps {
  children: ReactNode;
}

export function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
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
  
  // Always render the same component structure, but conditionally show mobile UI
  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple Mobile Header - only show on mobile, no hamburger menu */}
      {isMobile && (
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              {pathname !== "/" && (
                <button
                  onClick={() => window.history.back()}
                  className="mr-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Go back"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              <Link href="/" className="font-bold text-xl dark:text-white">
                Jackerbox
              </Link>
            </div>
            
            {/* No hamburger menu - everything is in bottom navigation */}
            <div className="text-sm text-gray-500">
              {/* Optional: Could add a small status indicator or current page title */}
            </div>
          </div>
        </header>
      )}
      
      {/* Main Content */}
      <main className={isMobile ? "flex-1 pb-16" : "flex-1"}>
        {children}
      </main>
      
      {/* Mobile Bottom Navigation - only show on mobile */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
} 