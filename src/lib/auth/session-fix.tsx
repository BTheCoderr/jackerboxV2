"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * This component helps fix NextAuth session issues by extending the session
 * fetch retry mechanism and adding event listeners for connection changes
 */
export function SessionStateManager() {
  const { status, update } = useSession();

  useEffect(() => {
    // Handle online/offline events
    const handleOnline = () => {
      console.log('Network connection restored, refreshing session');
      update(); // Update session when connection is restored
    };

    // Handle visibility change (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab is now visible, refreshing session');
        update();
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // If session is in error state, try to refresh it
    if (status === 'loading') {
      const timeout = setTimeout(() => {
        console.log('Session still loading after timeout, forcing refresh');
        update();
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeout);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, update]);

  // No UI is rendered
  return null;
} 