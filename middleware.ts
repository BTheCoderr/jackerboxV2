import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/upstash-rate-limit';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add caching headers for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Add caching for equipment images
  if (request.nextUrl.pathname.startsWith('/images/equipment/')) {
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  }
  
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Get identifier based on IP or token
    const ip = request.ip ?? '127.0.0.1';
    const token = await getToken({ req: request });
    const identifier = token ? `user_${token.sub}` : `ip_${ip}`;
    
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Add CSRF protection headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Check for CSRF token on state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const csrfToken = request.headers.get('X-CSRF-Token');
      const sessionToken = request.cookies.get('next-auth.csrf-token')?.value;
      
      if (!csrfToken || !sessionToken || !sessionToken.includes(csrfToken)) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid CSRF token' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    '/_next/static/:path*', 
    '/images/:path*',
    '/api/:path*'
  ],
};
