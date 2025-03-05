import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which paths should be protected
export const config = {
  matcher: [
    // Protect API routes
    '/api/:path*',
    // Protect admin routes
    '/admin/:path*',
    // Protect authentication routes
    '/auth/:path*',
  ],
};

export function middleware(request: NextRequest) {
  // Skip protection for static assets
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // For now, just pass through all requests
  // We'll implement Arcjet protection after we confirm the site is working
  return NextResponse.next();
} 