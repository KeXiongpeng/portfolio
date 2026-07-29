// web/app/projects/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Markdown } from '@/components/markdown';
import { JsonLd } from '@/components/json-ld';
import type { Project } from '@/lib/types';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const p = await api.getProject(params.slug);
    return { title: p.title, description: p.description };
  } catch {
    return { title: '项目不存在' };
  }
}

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  let project: Project | null = null;
  try {
    project = await api.getProject(params.slug);
  } catch {
    notFound();
  }

  return (
    <>
      {project && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: project.title,
            description: project.description,
            about: project.content,
            keywords: project.tech_stack,
            author: { '@type': 'Person', name: 'Your Name' },
            url: project.demo_url,
            codeRepository: project.github_url,
            image: project.cover_url,
          }}
        />
      )}
      <SiteHeader />
      <article className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition mb-8">
          ← 返回项目列表
        </Link>

        {project.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.cover_url} alt={project.title} className="w-full rounded-xl mb-8 border border-gray-200 dark:border-gray-800" />
        )}

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{project.title}</h1>
        {project.description && (
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">{project.description}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {project.tech_stack.map((t) => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{t}</span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {project.demo_url && (
            <a href={project.demo_url} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition shadow-sm shadow-blue-500/20">
              在线演示
            </a>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              GitHub
            </a>
          )}
        </div>

        {project.content && (
          <div className="mt-10"><Markdown content={project.content} /></div>
        )}
      </article>
      <SiteFooter />
    </>
  );
}
