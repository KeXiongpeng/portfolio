// web/components/project-filter.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Project } from '@/lib/types';

const filterBtn = (active: boolean) =>
  `px-3.5 py-1.5 rounded-full text-sm border transition ${
    active
      ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/20'
      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400'
  }`;

export function ProjectFilter({ projects, tags }: { projects: Project[]; tags: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const filtered = active ? projects.filter((p) => p.tech_stack.includes(active)) : projects;

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        <button onClick={() => setActive(null)} className={filterBtn(active === null)}>
          全部
        </button>
        {tags.map((t) => (
          <button key={t} onClick={() => setActive(t)} className={filterBtn(active === t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.slug}`}
            className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:-translate-y-0.5"
          >
            {p.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.cover_url} alt={p.title} className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105" />
            )}
            <div className="p-5">
              <h3 className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{p.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.tech_stack.map((t) => (
                  <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{t}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
