import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();
  const login = new URL('/auth/login', request.url);
  login.searchParams.set('callbackUrl', path);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    '/routes/dashboard/:path*',
    '/routes/equipment/new',
    '/routes/equipment/edit/:path*',
    '/routes/equipment/:path*/rent',
    '/routes/rentals/:path*',
    '/routes/messages/:path*',
    '/routes/profile/:path*',
  ],
};
