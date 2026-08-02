// web/app/api/auth/clear-cookie/route.ts
// 仅清除 cookie，不重定向。重定向由前端客户端完成。
import { NextResponse } from 'next/server';

export async function GET() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('token', '', { path: '/', maxAge: 0 });
  res.cookies.set('access_token', '', { path: '/', maxAge: 0 });
  return res;
}
