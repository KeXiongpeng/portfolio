// web/app/api/auth/set-cookie/route.ts
// 后端 GitHub 回调后，通过此中转路由在前端域名设置 cookie
// 解决跨子域 cookie 不可见问题（api 域设置的 cookie，web 域的 middleware 读不到）
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const dest = url.searchParams.get('dest') || '/admin/dashboard';

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  const res = NextResponse.redirect(new URL(dest, req.url));
  // httpOnly cookie：给 Next.js middleware 读取（判断是否登录）
  res.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  // 可读 cookie：给前端 fetch 时附加到 Authorization header（Vercel redirect 丢失 api cookie 的 workaround）
  res.cookies.set('access_token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res;
}
