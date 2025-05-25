"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusCircle, MessageSquare, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 flex justify-around items-center">
      <Link
        href="/"
        className={`flex flex-col items-center ${
          isActive('/') ? 'text-blue-600' : 'text-gray-600'
        }`}
      >
        <Home className="h-6 w-6" />
        <span className="text-xs mt-1">Home</span>
      </Link>

      <Link
        href="/routes/browse"
        className={`flex flex-col items-center ${
          isActive('/routes/browse') ? 'text-blue-600' : 'text-gray-600'
        }`}
      >
        <Search className="h-6 w-6" />
        <span className="text-xs mt-1">Browse</span>
      </Link>

      <Link
        href="/routes/equipment/new"
        className={`flex flex-col items-center ${
          isActive('/routes/equipment/new') ? 'text-blue-600' : 'text-gray-600'
        }`}
      >
        <PlusCircle className="h-6 w-6" />
        <span className="text-xs mt-1">List</span>
      </Link>

      <Link
        href="/routes/messages"
        className={`flex flex-col items-center ${
          isActive('/routes/messages') ? 'text-blue-600' : 'text-gray-600'
        }`}
      >
        <MessageSquare className="h-6 w-6" />
        <span className="text-xs mt-1">Messages</span>
      </Link>

      <Link
        href="/routes/profile"
        className={`flex flex-col items-center ${
          isActive('/routes/profile') ? 'text-blue-600' : 'text-gray-600'
        }`}
      >
        <User className="h-6 w-6" />
        <span className="text-xs mt-1">Profile</span>
      </Link>
    </nav>
  );
} 