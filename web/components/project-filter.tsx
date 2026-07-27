// web/components/project-filter.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Project } from '@/lib/types';

export function ProjectFilter({ projects, tags }: { projects: Project[]; tags: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const filtered = active ? projects.filter((p) => p.tech_stack.includes(active)) : projects;

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActive(null)}
          className={`px-3 py-1 rounded-full text-sm border transition ${active === null ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent' : 'border-gray-300 dark:border-gray-700'}`}
        >
          全部
        </button>
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-1 rounded-full text-sm border transition ${active === t ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent' : 'border-gray-300 dark:border-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Link key={p.id} href={`/projects/${p.slug}`} className="group rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition">
            {p.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.cover_url} alt={p.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-semibold group-hover:text-blue-500 transition">{p.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {p.tech_stack.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
