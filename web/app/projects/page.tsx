// web/app/projects/page.tsx
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Section } from '@/components/section';
import { ProjectFilter } from '@/components/project-filter';

export const metadata: Metadata = {
  title: '项目',
  description: '我的项目作品集',
};

export default async function ProjectsPage() {
  const projects = await api.getProjects().catch(() => []);
  const tags = Array.from(new Set(projects.flatMap((p) => p.tech_stack)));

  return (
    <>
      <SiteHeader />
      <Section title="项目作品">
        <ProjectFilter projects={projects} tags={tags} />
      </Section>
      <SiteFooter />
    </>
  );
}
