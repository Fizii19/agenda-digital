import { NextRequest, NextResponse } from 'next/server';
import { parseRolesCookie, protectedRoles, roleDashboards } from '@/lib/roles';
import type { Role } from '@/lib/types';

export function proxy(request: NextRequest) {
  const userRole = request.cookies.get('userRole')?.value;
  const userRoles = parseRolesCookie(request.cookies.get('userRoles')?.value);
  const { pathname } = request.nextUrl;
  const activeRole = userRole && protectedRoles.includes(userRole as Role) ? userRole as Role : undefined;
  const fallbackRole = activeRole ?? userRoles[0];

  // 1. If trying to access login page while already logged in
  if (pathname === '/' && fallbackRole) {
    return NextResponse.redirect(new URL(roleDashboards[fallbackRole], request.url));
  }

  // 2. Define protected routes
  const protectedRoutes = protectedRoles.map((role) => roleDashboards[role]);
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // 3. If no session, redirect to login
    if (!fallbackRole) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 4. If role mismatch, redirect to appropriate dashboard
    const roleInPath = pathname.split('/')[1];
    const allowedRoles = userRoles.length > 0 ? userRoles : [fallbackRole];
    if (!allowedRoles.includes(roleInPath as Role)) {
      return NextResponse.redirect(new URL(roleDashboards[fallbackRole], request.url));
    }

    if (roleInPath !== activeRole) {
      const response = NextResponse.next();
      response.cookies.set('userRole', roleInPath, { path: '/' });
      return response;
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
