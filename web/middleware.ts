// web/middleware.ts
import { NextResponse, NextRequest } from 'next/server';

// 仅对 /admin/* 生效。middleware 应保持轻量：只做 token 是否存在的快速检查，
// 真正的鉴权由后端 API 的 JwtAuthGuard 完成（页面内的数据请求都会带 cookie）。
// 这样可避免每次导航都阻塞式调用后端，造成后台菜单跳转卡顿。
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // 登录页本身不拦截
  if (pathname === '/admin/login') return NextResponse.next();

  // 只检查 token cookie 是否存在（不验证有效性，验证交给后端 API）
  const token = req.cookies.get('token')?.value;
  if (token) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
