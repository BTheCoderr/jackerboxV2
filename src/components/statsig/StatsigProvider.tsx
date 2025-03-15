'use client';

import { useState, useEffect } from 'react';
import { StatsigProvider } from '@statsig/react-bindings';
import { useSession } from 'next-auth/react';
import { STATSIG_CONFIG } from '@/lib/statsig-config';
import { createStatsigUser } from '@/lib/feature-flags';
import Statsig from '@statsig/js-client';

interface MyStatsigProviderProps {
  children: React.ReactNode;
}

/**
 * StatsigProvider component that initializes Statsig with the current user
 * @param children The children to render
 * @returns The StatsigProvider component
 */
export function MyStatsigProvider({ children }: MyStatsigProviderProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  // Create a Statsig user from the session
  const user = session?.user 
    ? createStatsigUser(session.user) 
    : { userID: 'anonymous' };

  useEffect(() => {
    // Set loading to false after a short delay
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Show loading state while Statsig initializes
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  return (
    <StatsigProvider
      sdkKey={STATSIG_CONFIG.CLIENT_KEY}
      user={user}
      options={{
        environment: { tier: process.env.NODE_ENV === 'production' ? 'production' : 'development' },
      }}
    >
      <div className={!isLoading ? '' : 'statsig-initializing'}>
        {children}
      </div>
    </StatsigProvider>
  );
} 