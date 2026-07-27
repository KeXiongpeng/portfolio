// web/app/llms.txt/route.ts
import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const profile = await api.getProfile().catch(() => null);
  const projects = await api.getProjects().catch(() => []);
  const blogs = await api.getBlogs(1, 10).then((r) => r.items).catch(() => []);

  const name = profile?.name || 'Your Name';
  const title = profile?.title || 'Full-Stack Developer';
  const bio = profile?.bio || '';

  const lines: string[] = [
    `# ${name}`,
    '',
    `> ${title}`,
    bio ? '' : '',
    bio,
    '',
    '## 关于',
    `本站是 ${name} 的个人作品集与技术博客，包含项目作品、技术文章与联系方式。`,
    '',
    '## 项目作品',
    ...projects.slice(0, 5).map(
      (p) => `- [${p.title}](${siteUrl}/projects/${p.slug}): ${p.description || ''}`,
    ),
    '',
    '## 最新博客',
    ...blogs.map(
      (b) => `- [${b.title}](${siteUrl}/blog/${b.slug}): ${b.summary || ''}`,
    ),
    '',
    '## 链接',
    `- 首页: ${siteUrl}`,
    `- 项目: ${siteUrl}/projects`,
    `- 博客: ${siteUrl}/blog`,
    `- 联系: ${siteUrl}/contact`,
  ];

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  });
}
