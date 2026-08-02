// web/middleware.ts
import { NextResponse, NextRequest } from 'next/server';

// 仅对 /admin/* 生效。middleware 应保持轻量：只做 token 是否存在的快速检查，
// 真正的鉴权由后端 API 的 JwtAuthGuard 完成（页面内的数据请求都会带 cookie）。
// 这样可避免每次导航都阻塞式调用后端，造成后台菜单跳转卡顿。
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 诊断日志：记录每个请求的基本信息
  console.log('=== Middleware 诊断日志 ===');
  console.log('1. 请求路径:', pathname);
  console.log('2. 请求 URL:', req.url);
  console.log('3. 请求 headers.host:', req.headers.get('host'));
  console.log('4. 请求 headers.x-forwarded-host:', req.headers.get('x-forwarded-host'));

  // 检测并修复容器 hostname 问题
  const host = req.headers.get('host') || '';
  const xForwardedHost = req.headers.get('x-forwarded-host') || '';
  const isContainerHostname = /^[a-f0-9]{12}:/i.test(host);

  if (isContainerHostname) {
    console.log('⚠️ 检测到容器 hostname:', host);
    console.log('x-forwarded-host:', xForwardedHost);

    // 如果有正确的 x-forwarded-host，重定向到正确的 URL
    if (xForwardedHost && !/^[a-f0-9]{12}:/i.test(xForwardedHost)) {
      const correctUrl = new URL(req.url);
      correctUrl.host = xForwardedHost.split(':')[0];
      correctUrl.port = xForwardedHost.split(':')[1] || '';
      console.log('重定向到正确 URL:', correctUrl.toString());
      return NextResponse.redirect(correctUrl);
    }

    // 如果没有 x-forwarded-host，尝试使用环境变量或默认IP
    const correctHost = process.env.HOSTNAME || '120.77.222.102';
    const correctUrl = new URL(req.url);
    correctUrl.host = correctHost;
    correctUrl.port = '3000';
    console.log('使用默认 host 重定向到:', correctUrl.toString());
    return NextResponse.redirect(correctUrl);
  }

  if (!pathname.startsWith('/admin')) {
    console.log('8. 非管理路径，直接放行');
    return NextResponse.next();
  }

  // 登录页、注册页本身不拦截
  if (pathname === '/admin/login' || pathname === '/admin/register') {
    console.log('8. 登录/注册页，直接放行');
    return NextResponse.next();
  }

  // 只检查 token cookie 是否存在（不验证有效性，验证交给后端 API）
  const token = req.cookies.get('token')?.value;
  if (token) {
    console.log('8. Token 存在，放行');
    return NextResponse.next();
  }

  console.log('8. Token 不存在，重定向到登录页');
  const loginUrl = req.nextUrl.clone();

  // 关键修复：确保使用相对路径进行重定向
  loginUrl.pathname = '/admin/login';
  loginUrl.searchParams.set('redirect', pathname);

  // 强制使用请求头中的正确主机名，而不是容器 hostname
  const correctHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (correctHost && !/^[a-f0-9]{12}:/i.test(correctHost)) {
    loginUrl.host = correctHost.split(':')[0];
    loginUrl.port = correctHost.split(':')[1] || '';
  }

  console.log('9. 重定向 URL:', loginUrl.toString());
  console.log('=== Middleware 诊断日志结束 ===');
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
