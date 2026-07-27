// web/app/api/blog-loader/route.ts
import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') || '1';
  const tag = searchParams.get('tag') || '';
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/blogs?page=${page}${tag ? `&tag=${tag}` : ''}`;
  const res = await fetch(apiUrl, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data);
}
