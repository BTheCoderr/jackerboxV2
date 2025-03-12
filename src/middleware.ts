import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Get the token and check if the user is logged in
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });
  const isLoggedIn = !!token;
  
  // If the user is not logged in and trying to access protected routes, redirect to login
  if (!isLoggedIn && (
    path.startsWith('/routes/dashboard') || 
    path.startsWith('/routes/equipment/new') || 
    path.startsWith('/routes/equipment/edit') ||
    path.includes('/routes/equipment/') && path.includes('/rent') ||
    path.startsWith('/routes/rentals') ||
    path.startsWith('/routes/messages') ||
    path.startsWith('/routes/profile')
  )) {
    // Add the callback URL to redirect back after login
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${encodeURIComponent(path)}`, request.url));
  }
  
  // If the user is logged in, check their user type for specific route restrictions
  if (isLoggedIn) {
    const userType = token.userType as string | undefined;
    
    // Owner-only routes
    const ownerOnlyRoutes = [
      '/routes/equipment/new',
      '/routes/equipment/edit',
    ];
    
    // Check if the path starts with any of the owner-only routes
    const isOwnerOnlyRoute = ownerOnlyRoutes.some(route => 
      path.startsWith(route)
    );
    
    // Renter-only routes - equipment rental pages
    const isRenterOnlyRoute = path.includes('/routes/equipment/') && path.includes('/rent');
    
    // Redirect renters trying to access owner-only routes
    if (userType === 'renter' && isOwnerOnlyRoute) {
      console.log('Renter trying to access owner-only route:', path);
      return NextResponse.redirect(new URL('/routes/dashboard?error=ownerOnly', request.url));
    }
    
    // Redirect owners trying to access renter-only routes
    if (userType === 'owner' && isRenterOnlyRoute) {
      console.log('Owner trying to access renter-only route:', path);
      return NextResponse.redirect(new URL('/routes/dashboard?error=renterOnly', request.url));
    }
  }
  
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    '/routes/dashboard/:path*',
    '/routes/equipment/new',
    '/routes/equipment/edit/:path*',
    '/routes/equipment/:path*/rent',
    '/routes/rentals/:path*',
    '/routes/messages',
    '/routes/messages/:path*',
    '/routes/profile/:path*',
  ],
}; 