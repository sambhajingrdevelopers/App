import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const adminToken = request.cookies.get('vibeloop_admin_token')?.value;

  const isAdminPage =
    pathname.startsWith('/admin') &&
    pathname !== '/admin-login';

  const isAdminApi = pathname.startsWith('/api/admin');

  if ((isAdminPage || isAdminApi) && !adminToken) {
    if (isAdminApi) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin login required'
        },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/admin-login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
