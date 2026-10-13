import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isStagingPreviewBlocked } from './lib/staging-preview';

const protectedRoutes = [
  /^\/routes\/dashboard(?:\/|$)/,
  /^\/routes\/equipment\/new(?:\/|$)/,
  /^\/routes\/equipment\/edit(?:\/|$)/,
  /^\/routes\/equipment\/.+\/rent(?:\/|$)/,
  /^\/routes\/rentals(?:\/|$)/,
  /^\/routes\/messages(?:\/|$)/,
  /^\/routes\/profile(?:\/|$)/,
];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Prevent even existing or misconfigured preview builds from serving
  // authenticated routes, API mutations or Server Actions before approval.
  if (isStagingPreviewBlocked(
    request.nextUrl.hostname,
    process.env.NEXT_PUBLIC_JACKERBOX_STAGING_PREVIEW,
    process.env.JACKERBOX_STAGING_READY,
  )) {
    return NextResponse.json(
      { error: 'JackerBox staging is not configured for testing.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // All API routes keep their own server-side authorization requirements.
  // Do not use the page-only NextAuth redirect for API requests.
  if (!protectedRoutes.some((pattern) => pattern.test(path))) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();
  const login = new URL('/auth/login', request.url);
  login.searchParams.set('callbackUrl', path);
  return NextResponse.redirect(login);
}

export const config = {
  // Include every application path so that unapproved previews cannot process
  // API requests or Server Actions on otherwise-public pages.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
