'use client';

import { useState, useEffect, ReactNode } from 'react';

interface ClientOnlyProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientOnlyProvider ensures that its children are only rendered on the client side
 * This prevents hydration mismatches for components that depend on browser APIs
 */
export function ClientOnlyProvider({ 
  children, 
  fallback = null 
}: ClientOnlyProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return fallback;
  }

  return <>{children}</>;
} 