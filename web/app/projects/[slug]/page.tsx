// web/app/projects/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Markdown } from '@/components/markdown';
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
      <SiteHeader />
      <article className="container mx-auto px-4 py-16 max-w-3xl">
        <Link href="/projects" className="text-sm text-gray-500 hover:underline mb-6 inline-block">← 返回项目列表</Link>

        {project.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.cover_url} alt={project.title} className="w-full rounded-lg mb-6" />
        )}

        <h1 className="text-3xl font-bold">{project.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.tech_stack.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t}</span>
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          {project.demo_url && (
            <a href={project.demo_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded bg-blue-500 text-white text-sm hover:bg-blue-600">在线演示</a>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">GitHub</a>
          )}
        </div>

        {project.content && (
          <div className="mt-8"><Markdown content={project.content} /></div>
        )}
      </article>
      <SiteFooter />
    </>
  );
}
