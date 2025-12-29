import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCompanyContext } from '@/lib/auth/session';

// REMOVE THIS: This is what is causing the crash
// import { query } from '@/lib/db/updated-connection'; 

const protectedRoutes = ['/api/leads', '/api/companies', '/api/dashboard', '/api/admin', '/api/users'];
const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/session', '/api/auth/navigation'];

export async function middleware(request: NextRequest) {
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (!protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  try {
    const companyContext = await getCompanyContext(request);

    if (!companyContext) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestHeaders = new Headers(request.headers);

    requestHeaders.set('x-company-id', companyContext.companyId.toString());

    requestHeaders.set('x-user-token', companyContext.userToken);
    requestHeaders.set('x-user-role-id', companyContext.roleId.toString());

    return NextResponse.next({
      request: { headers: requestHeaders },
    });

  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }
}

export const config = {
  matcher: [
    '/api/leads/:path*',
    '/api/companies/:path*',
    '/api/dashboard/:path*',
    '/api/admin/:path*',
    '/api/users/:path*'
  ],
};