// web/app/blog/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Markdown } from '@/components/markdown';
import { JsonLd } from '@/components/json-ld';
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
      {blog && (
        <>
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: blog.title,
              description: blog.summary,
              datePublished: blog.published_at,
              dateModified: blog.updated_at,
              articleBody: blog.content,
              keywords: blog.tags,
              author: { '@type': 'Person', name: 'Your Name' },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${blog.slug}`,
              },
            }}
          />
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: '首页', item: process.env.NEXT_PUBLIC_SITE_URL },
                { '@type': 'ListItem', position: 2, name: '博客', item: `${process.env.NEXT_PUBLIC_SITE_URL}/blog` },
                { '@type': 'ListItem', position: 3, name: blog.title },
              ],
            }}
          />
        </>
      )}
      <SiteHeader />
      <article className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition mb-8">
          ← 返回博客列表
        </Link>

        {blog.cover_url && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img src={blog.cover_url} alt={blog.title} className="w-full object-cover" />
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400">
          {blog.published_at?.slice(0, 10)} · 阅读 {blog.view_count}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-3">{blog.title}</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          {blog.tags.map((t) => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{t}</span>
          ))}
        </div>

        <div className="mt-10"><Markdown content={blog.content} /></div>

        {/* 上一篇/下一篇 */}
        <nav className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-800 pt-8">
          {prev ? (
            <Link href={`/blog/${prev.slug}`} className="group rounded-xl border border-gray-200 dark:border-gray-800 p-4 transition hover:border-blue-500/50 hover:shadow-sm">
              <span className="text-xs text-gray-500 dark:text-gray-400">← 上一篇</span>
              <p className="font-medium mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{prev.title}</p>
            </Link>
          ) : <div className="hidden sm:block" />}
          {next ? (
            <Link href={`/blog/${next.slug}`} className="group rounded-xl border border-gray-200 dark:border-gray-800 p-4 transition hover:border-blue-500/50 hover:shadow-sm sm:text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400">下一篇 →</span>
              <p className="font-medium mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{next.title}</p>
            </Link>
          ) : <div className="hidden sm:block" />}
        </nav>
      </article>
      <SiteFooter />
    </>
  );
}
