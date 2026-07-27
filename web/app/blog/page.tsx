// web/app/blog/page.tsx
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Section } from '@/components/section';
import { BlogList } from '@/components/blog-pagination';

export const metadata: Metadata = {
  title: '博客',
  description: '我的技术博客文章',
};

export default async function BlogPage() {
  const data = await api.getBlogs(1, 10).catch(() => ({ items: [], total: 0, page: 1, totalPages: 1 }));
  const tags = Array.from(new Set(data.items.flatMap((b) => b.tags)));

  return (
    <>
      <SiteHeader />
      <Section title="博客">
        <BlogList initialBlogs={data.items} totalPages={data.totalPages} tags={tags} />
      </Section>
      <SiteFooter />
    </>
  );
}
