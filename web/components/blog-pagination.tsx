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

  const filterBtn = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm border transition ${
      active
        ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/20'
        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400'
    }`;

  const pageBtn =
    'px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-800 dark:disabled:hover:text-current';

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        <button onClick={() => { setTag(null); load(1, null); }} className={filterBtn(tag === null)}>
          全部
        </button>
        {tags.map((t) => (
          <button key={t} onClick={() => { setTag(t); load(1, t); }} className={filterBtn(tag === t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {blogs.map((b) => (
          <Link
            key={b.id}
            href={`/blog/${b.slug}`}
            className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 transition-all duration-300 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:-translate-y-0.5"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">{b.published_at?.slice(0, 10)} · 阅读 {b.view_count}</p>
            <h3 className="font-semibold mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{b.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-3">{b.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {b.tags.map((t) => (
                <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{t}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex justify-center items-center gap-3">
        <button disabled={page === 1 || loading} onClick={() => load(page - 1, tag)} className={pageBtn}>上一页</button>
        <span className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
        <button disabled={page >= totalPages || loading} onClick={() => load(page + 1, tag)} className={pageBtn}>下一页</button>
      </div>
    </>
  );
}
