import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import arcjet, { shield, detectBot, tokenBucket } from '@arcjet/next';

// Initialize Arcjet with your configuration
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["ip.src"],
  rules: [
    // Shield protects your app from common attacks
    shield({ mode: "LIVE" }),
    
    // Bot detection with allowlist for legitimate bots
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Allow search engines
        "CATEGORY:MONITOR",       // Allow uptime monitoring
        "CATEGORY:PREVIEW",       // Allow link previews
      ],
    }),
    
    // Rate limiting to prevent abuse
    tokenBucket({
      mode: "LIVE",
      refillRate: 20,  // Higher rate for general site access
      interval: 10,    // 10 second interval
      capacity: 30,    // Allow bursts of activity
    }),
  ],
});

// Define which paths should be protected
export const config = {
  matcher: [
    // Protect API routes
    '/api/:path*',
    // Protect admin routes
    '/admin/:path*',
    // Protect authentication routes
    '/auth/:path*',
    // Add other sensitive routes as needed
  ],
};

export async function middleware(request: NextRequest) {
  // Skip protection for static assets
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Apply Arcjet protection
  const decision = await aj.protect(request, { requested: 1 });
  
  // If the request is denied, return an appropriate response
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too Many Requests',
          message: 'Please slow down and try again later.'
        }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    } else if (decision.reason.isBot()) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Access Denied',
          message: 'Bot traffic not allowed.'
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    } else {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Access Denied',
          message: 'Your request has been blocked.'
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
} 