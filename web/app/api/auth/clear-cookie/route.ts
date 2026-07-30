// web/app/api/auth/clear-cookie/route.ts
// 登出时清除前端域的两个 cookie（token 是 httpOnly，JS 无法清除，必须走服务端）
import { NextResponse } from 'next/server';

export async function GET() {
  const res = NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  res.cookies.set('token', '', { path: '/', maxAge: 0 });
  res.cookies.set('access_token', '', { path: '/', maxAge: 0 });
  return res;
}
