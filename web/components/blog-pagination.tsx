// web/components/blog-pagination.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Blog } from '@/lib/types';

export function BlogList({ initialBlogs, totalPages, tags }: {
  initialBlogs: Blog[]; totalPages: number; tags: string[];
}) {
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState<string | null>(null);
  const [blogs, setBlogs] = useState(initialBlogs);
  const [loading, setLoading] = useState(false);

  async function load(newPage: number, newTag: string | null) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/blog-loader?page=${newPage}${newTag ? `&tag=${encodeURIComponent(newTag)}` : ''}`
      ).then((r) => r.json());
      setBlogs(res.items);
      setPage(newPage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        <button onClick={() => { setTag(null); load(1, null); }}
          className={`px-3 py-1 rounded-full text-sm border ${tag === null ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent' : 'border-gray-300 dark:border-gray-700'}`}>
          全部
        </button>
        {tags.map((t) => (
          <button key={t} onClick={() => { setTag(t); load(1, t); }}
            className={`px-3 py-1 rounded-full text-sm border ${tag === t ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent' : 'border-gray-300 dark:border-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {blogs.map((b) => (
          <Link key={b.id} href={`/blog/${b.slug}`} className="group rounded-lg border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg transition">
            <p className="text-xs text-gray-500">{b.published_at?.slice(0, 10)} · 阅读 {b.view_count}</p>
            <h3 className="font-semibold mt-1 group-hover:text-blue-500 transition">{b.title}</h3>
            <p className="text-sm text-gray-500 mt-2 line-clamp-3">{b.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {b.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-2">
        <button disabled={page === 1 || loading} onClick={() => load(page - 1, tag)} className="px-3 py-1 text-sm border rounded disabled:opacity-50">上一页</button>
        <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
        <button disabled={page >= totalPages || loading} onClick={() => load(page + 1, tag)} className="px-3 py-1 text-sm border rounded disabled:opacity-50">下一页</button>
      </div>
    </>
  );
}
