// web/app/blog/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Markdown } from '@/components/markdown';
import type { Blog } from '@/lib/types';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const b = await api.getBlog(params.slug);
    return { title: b.title, description: b.summary };
  } catch {
    return { title: '文章不存在' };
  }
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  let blog: Blog | null = null;
  try {
    blog = await api.getBlog(params.slug);
  } catch {
    notFound();
  }

  // 获取上一篇/下一篇（取最新列表做近似）
  const list = await api.getBlogs(1, 100).catch(() => ({ items: [] as Blog[] }));
  const idx = list.items.findIndex((b) => b.slug === params.slug);
  const prev = idx > 0 ? list.items[idx - 1] : null;
  const next = idx < list.items.length - 1 ? list.items[idx + 1] : null;

  return (
    <>
      <SiteHeader />
      <article className="container mx-auto px-4 py-16 max-w-3xl">
        <Link href="/blog" className="text-sm text-gray-500 hover:underline mb-6 inline-block">← 返回博客列表</Link>

        <p className="text-sm text-gray-500">
          {blog.published_at?.slice(0, 10)} · 阅读 {blog.view_count}
        </p>
        <h1 className="text-3xl font-bold mt-2">{blog.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {blog.tags.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t}</span>
          ))}
        </div>

        <div className="mt-8"><Markdown content={blog.content} /></div>

        {/* 上一篇/下一篇 */}
        <nav className="mt-12 grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-800 pt-6">
          {prev ? (
            <Link href={`/blog/${prev.slug}`} className="text-sm hover:underline">
              <span className="text-gray-500">← 上一篇</span>
              <p className="font-medium">{prev.title}</p>
            </Link>
          ) : <div />}
          {next ? (
            <Link href={`/blog/${next.slug}`} className="text-sm hover:underline text-right">
              <span className="text-gray-500">下一篇 →</span>
              <p className="font-medium">{next.title}</p>
            </Link>
          ) : <div />}
        </nav>
      </article>
      <SiteFooter />
    </>
  );
}
