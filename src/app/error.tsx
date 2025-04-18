'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-800" suppressHydrationWarning>
        Something went wrong
      </h1>
      <div className="h-1 w-24 bg-black my-6"></div>
      <p className="text-gray-600 max-w-md mb-8">
        We apologize for the inconvenience. An unexpected error has occurred.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={reset}
          className="px-6 py-3 bg-black text-white rounded-md hover:bg-opacity-90 transition-all"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 border border-black text-black rounded-md hover:bg-gray-100 transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
} 