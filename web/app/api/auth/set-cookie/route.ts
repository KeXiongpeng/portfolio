// web/app/api/auth/set-cookie/route.ts
// 仅设置 cookie，不重定向。重定向由前端客户端完成，避免容器 hostname 泄漏。
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'missing token' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  res.cookies.set('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  return res;
}
