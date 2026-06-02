import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const userRole = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // 1. If trying to access login page while already logged in
  if (pathname === '/' && userRole) {
    return NextResponse.redirect(new URL(`/${userRole}`, request.url));
  }

  // 2. Define protected routes
  const protectedRoutes = ['/admin', '/sekretaris', '/walikelas', '/pimpinan', '/siswa', '/guru'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // 3. If no session, redirect to login
    if (!userRole) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 4. If role mismatch, redirect to appropriate dashboard
    const roleInPath = pathname.split('/')[1];
    if (roleInPath !== userRole) {
      return NextResponse.redirect(new URL(`/${userRole}`, request.url));
    }
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
