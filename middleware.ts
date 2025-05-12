import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add caching headers for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Add caching for equipment images
  if (request.nextUrl.pathname.startsWith('/images/equipment/')) {
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  }

  // Fix for Google OAuth callback on port 3001
  if (request.nextUrl.pathname.startsWith('/api/auth/callback/google') && 
      request.nextUrl.searchParams.has('state') && 
      request.nextUrl.port === '3000') {
    // Redirect to the same path but on port 3001
    const url = request.nextUrl.clone();
    url.port = '3001';
    return NextResponse.redirect(url);
  }
  
  return response;
}

export const config = {
  matcher: [
    '/_next/static/:path*', 
    '/images/:path*',
    '/api/auth/callback/google',
  ],
};
