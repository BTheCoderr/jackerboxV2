"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

/**
 * SessionStateManager monitors and fixes session state issues
 * 
 * This component:
 * 1. Detects session state inconsistencies
 * 2. Fixes issues with cookie storage
 * 3. Handles silent re-authentication when needed
 * 4. Monitors session expiration and triggers renewal
 */
export function SessionStateManager() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    // Only run checks if we're in an authenticated state or actively trying to authenticate
    if (status === "loading" || isFixing) return;

    // Check for potential session inconsistencies
    if (status === "authenticated" && !session) {
      console.warn("Session inconsistency detected: Authenticated without session data");
      restartAuthFlow();
    }

    // Check for malformed session data
    if (session && (!session.user || !session.expires)) {
      console.warn("Malformed session detected: Missing critical fields");
      restartAuthFlow();
    }

    // Check for expired session that hasn't been cleared
    if (session && session.expires) {
      const expiryDate = new Date(session.expires);
      if (expiryDate < new Date()) {
        console.warn("Expired session detected");
        clearCookies();
        router.refresh();
      }
    }

    // Monitor for inconsistent state with protected routes
    const isProtectedRoute = pathname?.includes("/routes/dashboard") || 
                            pathname?.includes("/routes/admin") ||
                            pathname?.includes("/routes/profile");
    
    if (isProtectedRoute && status === "unauthenticated") {
      console.warn("Unauthenticated access to protected route detected");
      router.push("/auth/login?callbackUrl=" + encodeURIComponent(pathname || "/"));
    }
  }, [session, status, pathname, router, isFixing]);

  // Function to clear session cookies
  const clearCookies = () => {
    try {
      document.cookie = "next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie = "next-auth.csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie = "next-auth.callback-url=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      console.log("Session cookies cleared");
    } catch (error) {
      console.error("Error clearing cookies:", error);
    }
  };

  // Function to restart authentication flow
  const restartAuthFlow = () => {
    setIsFixing(true);
    clearCookies();
    
    // Trigger a hard refresh to reset the app state
    setTimeout(() => {
      router.refresh();
      setIsFixing(false);
    }, 500);
  };

  // This component doesn't render anything visible
  return null;
} 