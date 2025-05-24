"use client";

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { resetAuthCookies, isJWEDecryptionError } from './session-reset';
import { toast } from 'sonner';

/**
 * This component helps fix NextAuth session issues by extending the session
 * fetch retry mechanism and adding event listeners for connection changes
 */
export function SessionStateManager() {
  const { status, update } = useSession();
  const [hasResetCookies, setHasResetCookies] = useState(false);

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

    // Handle JWT decryption errors from console
    const handleConsoleError = (event: ErrorEvent) => {
      if (isJWEDecryptionError(event.error) && !hasResetCookies) {
        console.log('JWT decryption error detected, resetting auth cookies');
        resetAuthCookies();
        setHasResetCookies(true);
        toast("Session error detected", {
          description: "Your session has been reset. Please refresh the page or sign in again.",
          duration: 10000
        });
        
        // Sign out the user to clear session state
        signOut({ redirect: false });
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('error', handleConsoleError);

    // If session is in error state, try to refresh it
    let timeout: NodeJS.Timeout | null = null;
    if (status === 'loading') {
      timeout = setTimeout(() => {
        console.log('Session still loading after timeout, forcing refresh');
        update();
      }, 5000); // 5 second timeout
    }

    // Single cleanup function for all resources
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('error', handleConsoleError);
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [status, update, hasResetCookies]);

  // No UI is rendered
  return null;
} 