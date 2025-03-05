import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Disable middleware completely for now
export const config = {
  matcher: [],
};

export function middleware(request: NextRequest) {
  // For now, just pass through all requests without any middleware processing
  // This ensures compatibility with Netlify's edge functions
  return NextResponse.next();
} 