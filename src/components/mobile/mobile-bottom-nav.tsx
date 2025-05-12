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

  // Create a function to determine if a link is active
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') {
      return true;
    }
    if (path !== '/' && pathname?.startsWith(path)) {
      return true;
    }
    return false;
  };

  return (
    <div 
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 transition-transform duration-300 shadow-lg",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <nav className="flex justify-around items-center h-16">
        <NavLink href="/" isActive={isActive('/')} label="Home" icon={<Home size={20} />} />
        <NavLink href="/routes/equipment" isActive={isActive('/routes/equipment')} label="Equipment" icon={<Search size={20} />} />
        <NavLink href="/routes/dashboard/rentals" isActive={isActive('/routes/dashboard/rentals')} label="Rentals" icon={<Calendar size={20} />} />
        <NavLink href="/routes/messages" isActive={isActive('/routes/messages')} label="Messages" icon={<MessageSquare size={20} />} />
        <NavLink 
          href={session ? "/routes/profile/settings" : "/auth/login"} 
          isActive={isActive('/routes/profile/settings')}
          label="Settings"
          icon={<Settings size={20} />}
        />
      </nav>
    </div>
  );
}

// Helper component for nav links
function NavLink({ href, isActive, label, icon }: { 
  href: string; 
  isActive: boolean; 
  label: string; 
  icon: React.ReactNode 
}) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex flex-col items-center justify-center w-full h-full text-xs transition-colors duration-200",
        isActive
          ? "text-blue-600 dark:text-blue-400" 
          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
      )}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </Link>
  );
} 