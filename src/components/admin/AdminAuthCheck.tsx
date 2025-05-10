'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AdminAuthCheckProps {
  children: React.ReactNode;
}

/**
 * Component that restricts access to admin-only pages
 * Redirects non-admin users to the login page
 */
export function AdminAuthCheck({ children }: AdminAuthCheckProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        if (status === 'loading') return;
        
        if (status === 'unauthenticated') {
          // Redirect to login if not authenticated
          toast.error('You must be logged in to access this page');
          router.push('/auth/login?callbackUrl=/admin');
          return;
        }
        
        // If authenticated, check if user is an admin
        const response = await fetch('/api/admin/check-role');
        const data = await response.json();
        
        if (data.isAdmin) {
          setIsAuthorized(true);
        } else {
          // Not an admin, redirect to home
          toast.error('You do not have permission to access this page');
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        toast.error('Failed to verify admin permissions');
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAdmin();
  }, [status, router]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <div className="mt-4 text-lg font-medium">Verifying admin access...</div>
        </div>
      </div>
    );
  }
  
  // Show error for non-admins that managed to bypass client-side redirects
  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md p-8 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-800">Access Denied</h1>
          <p className="mt-2 text-red-600">You do not have permission to access this page.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  // Admin is authorized, show the content
  return <>{children}</>;
} 