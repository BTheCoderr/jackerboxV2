import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected, /protected/123)
  const path = request.nextUrl.pathname;

  // Define paths that should be protected
  const protectedPaths = [
    '/routes/dashboard',
    '/routes/admin',
    '/routes/equipment/new',
    '/routes/profile',
    '/routes/rentals',
    '/routes/messages',
  ];

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(prefix => path.startsWith(prefix));

  // If it's not a protected path, don't do anything
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Get the token from the cookies
  const token = request.cookies.get('next-auth.session-token')?.value;

  // If there's no token and it's a protected route,
  // redirect to the login page
  if (!token && isProtectedPath) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 