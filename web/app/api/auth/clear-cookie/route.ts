// web/app/api/auth/clear-cookie/route.ts
// 登出时清除前端域的两个 cookie（token 是 httpOnly，JS 无法清除，必须走服务端）
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // 用相对路径 redirect，避免依赖 NEXT_PUBLIC_SITE_URL（之前该变量是 placeholder 导致跳转到错误域名）
  const res = NextResponse.redirect(new URL('/admin/login', req.url));
  res.cookies.set('token', '', { path: '/', maxAge: 0 });
  res.cookies.set('access_token', '', { path: '/', maxAge: 0 });
  return res;
}
