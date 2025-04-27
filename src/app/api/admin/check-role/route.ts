import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';
import { log } from '@/lib/monitoring';

/**
 * API endpoint to check if the current user has admin role
 */
export async function GET() {
  try {
    // Verify the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { isAdmin: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check the user's role in the database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    
    // Check if user has admin role
    const isAdmin = user?.role === 'ADMIN';
    
    // Log access attempts (successful ones with less detail for privacy)
    if (isAdmin) {
      log.info('Admin role verified', { userId: session.user.id });
    } else {
      log.warn('Non-admin user attempted to access admin resource', { 
        userId: session.user.id,
        userEmail: session.user.email,
      });
    }
    
    // Return the result
    return NextResponse.json({ isAdmin });
    
  } catch (error) {
    // Log the error
    log.error('Error checking admin role', { 
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    
    // Return error response
    return NextResponse.json(
      { isAdmin: false, error: 'Failed to check admin role' },
      { status: 500 }
    );
  }
} 