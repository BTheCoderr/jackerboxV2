'use client';

import Link from 'next/link';
import { ClientOnly } from '@/lib/utils/hydration-safe';
import { useEffect, useState } from 'react';

/**
 * A hydration-safe 404 page component
 * This component only renders on the client side to prevent hydration mismatches
 */
export function NotFoundPage() {
  // Use a state to ensure consistent rendering after hydration
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Only render the full content once hydrated
  return (
    <ClientOnly fallback={<SimpleNotFoundFallback />}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center" data-testid="404-page">
        <h1 className="text-9xl font-bold text-gray-800" suppressHydrationWarning>404</h1>
        <div className="h-1 w-24 bg-black my-6"></div>
        <h2 className="text-2xl font-medium text-gray-800 mb-6" suppressHydrationWarning>
          This page could not be found.
        </h2>
        <p className="text-gray-600 max-w-md mb-8">
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="px-6 py-3 bg-black text-white rounded-md hover:bg-opacity-90 transition-all"
            data-testid="404-home-link"
          >
            Go Home
          </Link>
          <Link
            href="/routes/equipment"
            className="px-6 py-3 border border-black text-black rounded-md hover:bg-gray-100 transition-all"
            data-testid="404-browse-link"
          >
            Browse Equipment
          </Link>
        </div>
      </div>
    </ClientOnly>
  );
}

/**
 * A simple fallback that displays minimal content during server rendering and hydration
 * This helps prevent hydration mismatches
 */
function SimpleNotFoundFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center" data-testid="404-page">
      <div className="text-9xl font-bold text-gray-800" suppressHydrationWarning>404</div>
      <div className="h-1 w-24 bg-black my-6"></div>
      <div className="text-2xl font-medium text-gray-800 mb-6" suppressHydrationWarning>
        Page not found
      </div>
    </div>
  );
}

// Also export as default for dynamic imports
export default NotFoundPage; 