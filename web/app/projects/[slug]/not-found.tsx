// web/app/projects/[slug]/not-found.tsx
import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-32 text-center">
      <h1 className="text-2xl font-bold">项目不存在</h1>
      <Link href="/projects" className="mt-4 inline-block text-blue-500 underline">返回项目列表</Link>
    </div>
  );
}
