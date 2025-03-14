'use client';

import { ReactNode, useEffect } from 'react';
import { initializeStatsig, createStatsigUser } from '@/lib/feature-flags';
import { useSession } from 'next-auth/react';

interface FeatureFlagProviderProps {
  children: ReactNode;
}

/**
 * FeatureFlagProvider initializes Statsig for feature flags
 * and provides feature flags to the application
 */
export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
  const { data: session } = useSession();
  
  useEffect(() => {
    // Initialize Statsig with the current user
    const user = session?.user ? createStatsigUser(session.user) : { userID: 'anonymous' };
    initializeStatsig(user);
    
    // Clean up Statsig when the component unmounts
    return () => {
      // Statsig doesn't have a cleanup function in the current version
    };
  }, [session]);
  
  return <>{children}</>;
} 