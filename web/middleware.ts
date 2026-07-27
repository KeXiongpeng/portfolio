// web/middleware.ts
import { NextResponse, NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // 登录页本身不拦截
  if (pathname === '/admin/login') return NextResponse.next();

  // 通过调用后端的受保护接口（/api/admin/profile）判断 JWT 是否有效
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const cookie = req.headers.get('cookie') || '';

  try {
    const res = await fetch(`${apiUrl}/api/admin/profile`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (res.ok) return NextResponse.next();
  } catch {}

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
