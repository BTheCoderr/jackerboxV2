import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { apiRateLimiter, authRateLimiter, messageRateLimiter, rateLimitRequest } from './lib/rate-limiter';
import { rateLimit } from '@/lib/upstash-rate-limit';

// Cache commonly used URLs
const PROTECTED_ROUTES = new Set([
  '/routes/dashboard',
  '/routes/equipment/new',
  '/routes/equipment/edit',
  '/routes/rentals',
  '/routes/messages',
  '/routes/profile'
]);

// Cache response headers
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Enhanced caching strategies
const CACHE_STRATEGIES = {
  static: 'public, max-age=31536000, immutable',
  api: 'public, s-maxage=60, stale-while-revalidate=300',
  dynamic: 'public, s-maxage=30, stale-while-revalidate=60',
  protected: 'private, no-cache, no-store, must-revalidate'
};

// Function to determine if a path is static
const isStaticAsset = (path: string) => /\.(jpg|jpeg|png|gif|ico|svg|css|js)$/.test(path);

// Paths that should be rate limited
const RATE_LIMITED_PATHS = [
  '/api/auth',
  '/api/equipment',
  '/api/rentals',
  '/api/messages',
  '/api/payments',
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Fast path for static assets with edge caching
  if (isStaticAsset(path)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', CACHE_STRATEGIES.static);
    response.headers.set('CDN-Cache-Control', CACHE_STRATEGIES.static);
    response.headers.set('Vercel-CDN-Cache-Control', CACHE_STRATEGIES.static);
    return response;
  }

  // Apply rate limiting for API routes
  if (path.startsWith('/api')) {
    // Get IP for rate limiting
    const ip = request.ip || 
               request.headers.get('x-real-ip') || 
               request.headers.get('x-forwarded-for') || 
               '127.0.0.1';
               
    const identifier = `${path}:${ip}`;
    const rateLimitResult = await rateLimit(identifier);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    // Continue with the request
    const response = NextResponse.next();
    
    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add appropriate caching strategy
    response.headers.set('Cache-Control', CACHE_STRATEGIES.api);
    response.headers.set('CDN-Cache-Control', CACHE_STRATEGIES.api);
    response.headers.set('Vercel-CDN-Cache-Control', CACHE_STRATEGIES.api);
    
    return response;
  }

  // Get the token and check if the user is logged in
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });
  const isLoggedIn = !!token;
  
  // Check if the path starts with any protected route
  const isProtectedRoute = Array.from(PROTECTED_ROUTES).some(route => 
    path.startsWith(route)
  );

  // Redirect to login if trying to access protected routes while not logged in
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // User type checks for logged-in users
  if (isLoggedIn && token.userType) {
    const userType = token.userType as string;
    
    // Owner/Renter specific redirects
    if ((userType === 'renter' && path.startsWith('/routes/equipment/new')) ||
        (userType === 'owner' && path.includes('/rent'))) {
      return NextResponse.redirect(
        new URL(`/routes/dashboard?error=${userType}Only`, request.url)
      );
    }
  }

  // Apply headers to response
  const response = NextResponse.next();
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add appropriate caching strategy based on route type
  if (isProtectedRoute) {
    response.headers.set('Cache-Control', CACHE_STRATEGIES.protected);
  } else {
    response.headers.set('Cache-Control', CACHE_STRATEGIES.dynamic);
    response.headers.set('CDN-Cache-Control', CACHE_STRATEGIES.dynamic);
    response.headers.set('Vercel-CDN-Cache-Control', CACHE_STRATEGIES.dynamic);
  }

  // Check if path should be rate limited
  if (RATE_LIMITED_PATHS.some(limitedPath => path.startsWith(limitedPath))) {
    // Get IP for rate limiting
    const ip = request.ip || 
               request.headers.get('x-real-ip') || 
               request.headers.get('x-forwarded-for') || 
               '127.0.0.1';

    const identifier = `${path}:${ip}`;
    const rateLimitResult = await rateLimit(identifier);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }

  return response;
}

// Fixed matcher configuration
export const config = {
  matcher: [
    // Protected routes
    '/routes/dashboard/:path*',
    '/routes/equipment/:path*',
    '/routes/rentals/:path*',
    '/routes/messages/:path*',
    '/routes/profile/:path*',
    // API routes
    '/api/:path*',
    // Static assets (fixed pattern)
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}; 