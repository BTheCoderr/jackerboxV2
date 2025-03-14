'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { StatsigProvider } from '@statsig/react-bindings';
import { useSession } from 'next-auth/react';
import { STATSIG_CONFIG } from '@/lib/statsig-config';

interface MyStatsigProviderProps {
  children: ReactNode;
}

/**
 * StatsigProvider component that initializes Statsig with the current user
 * and provides feature flags to the application
 */
export function MyStatsigProvider({ children }: MyStatsigProviderProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  
  // Create a Statsig user from the session
  const user = session?.user ? {
    userID: session.user.id || 'anonymous',
    email: session.user.email || undefined,
    custom: {
      isAdmin: session.user.isAdmin || false,
      userType: session.user.userType || 'guest',
    }
  } : { userID: 'anonymous' };
  
  // Show loading state while Statsig initializes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
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