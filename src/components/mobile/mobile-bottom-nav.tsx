"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Calendar, MessageSquare, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide bottom nav when scrolling down, show when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Don't show on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  return (
    <div 
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <nav className="flex justify-around items-center h-16">
        <Link 
          href="/" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full text-xs",
            pathname === '/' 
              ? "text-blue-600 dark:text-blue-400" 
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          <Home size={20} />
          <span className="mt-1">Home</span>
        </Link>
        
        <Link 
          href="/routes/equipment" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full text-xs",
            pathname?.startsWith('/routes/equipment') 
              ? "text-blue-600 dark:text-blue-400" 
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          <Search size={20} />
          <span className="mt-1">Equipment</span>
        </Link>
        
        <Link 
          href="/routes/dashboard/rentals" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full text-xs",
            pathname?.startsWith('/routes/dashboard/rentals') 
              ? "text-blue-600 dark:text-blue-400" 
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          <Calendar size={20} />
          <span className="mt-1">Rentals</span>
        </Link>
        
        <Link 
          href="/routes/messages" 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full text-xs",
            pathname?.startsWith('/routes/messages') 
              ? "text-blue-600 dark:text-blue-400" 
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          <MessageSquare size={20} />
          <span className="mt-1">Messages</span>
        </Link>
        
        <Link 
          href={session ? "/routes/profile/settings" : "/auth/login"} 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full text-xs",
            pathname?.startsWith('/routes/profile/settings') 
              ? "text-blue-600 dark:text-blue-400" 
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          <Settings size={20} />
          <span className="mt-1">Settings</span>
        </Link>
      </nav>
    </div>
  );
} 