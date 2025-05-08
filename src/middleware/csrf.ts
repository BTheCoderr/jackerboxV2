import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { csrfConfig } from '@/lib/config/security';
import { redis } from '@/lib/config/security';
import { randomBytes } from 'crypto';

// Methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// Generate a new CSRF token
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

// Store CSRF token in Redis
async function storeCSRFToken(token: string, userId: string): Promise<void> {
  await redis.set(`csrf:${userId}:${token}`, '1', { ex: 3600 }); // 1 hour expiry
}

// Verify CSRF token
async function verifyCSRFToken(token: string, userId: string): Promise<boolean> {
  const exists = await redis.get(`csrf:${userId}:${token}`);
  return !!exists;
}

// CSRF Middleware
export async function csrfMiddleware(request: NextRequest) {
  // Skip CSRF check for non-protected methods
  if (!PROTECTED_METHODS.includes(request.method)) {
    return NextResponse.next();
  }

  // Skip CSRF check for public routes
  const path = request.nextUrl.pathname;
  if (path.startsWith('/api/public') || path.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Get user ID from session
  const session = request.cookies.get('session')?.value;
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get CSRF token from header
  const csrfToken = request.headers.get(csrfConfig.headerName);
  if (!csrfToken) {
    return NextResponse.json(
      { error: 'CSRF token missing' },
      { status: 403 }
    );
  }

  // Verify CSRF token
  const isValid = await verifyCSRFToken(csrfToken, session);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  // Continue with the request
  return NextResponse.next();
}

// Generate and set CSRF token for new sessions
export async function setCSRFToken(response: NextResponse, userId: string): Promise<void> {
  const token = generateCSRFToken();
  await storeCSRFToken(token, userId);
  
  // Set CSRF token in cookie
  response.cookies.set(csrfConfig.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
} 