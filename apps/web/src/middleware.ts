import { NextRequest, NextResponse } from 'next/server';

const protectedPrefixes = ['/dashboard', '/my-courses', '/profile', '/certificates', '/admin'];

export function middleware(request: NextRequest) {
  const access = request.cookies.get('qnyne_access')?.value;
  const pathname = request.nextUrl.pathname;
  if (pathname === '/admin/login') return NextResponse.next();
  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) && !access) {
    return NextResponse.redirect(new URL(pathname.startsWith('/admin') ? '/admin/login' : '/login', request.url));
  }
  if (pathname.startsWith('/admin') && access) {
    try {
      const payload = JSON.parse(atob(access.split('.')[1] ?? '')) as { role?: string };
      if (payload.role !== 'ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/my-courses/:path*', '/profile/:path*', '/certificates/:path*', '/admin/:path*'],
  runtime: 'nodejs',
};
