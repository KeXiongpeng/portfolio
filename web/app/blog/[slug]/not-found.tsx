// web/app/blog/[slug]/not-found.tsx
import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-32 text-center">
      <h1 className="text-2xl font-bold">文章不存在</h1>
      <Link href="/blog" className="mt-4 inline-block text-blue-500 underline">返回博客列表</Link>
    </div>
  );
}
