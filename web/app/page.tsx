// web/app/page.tsx
import Link from 'next/link';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Section } from '@/components/section';
import type { Profile, Project, Blog } from '@/lib/types';

export default async function HomePage() {
  let profile: Profile | null = null;
  let projects: Project[] = [];
  let blogs: Blog[] = [];

  try {
    [profile, projects, blogs] = await Promise.all([
      api.getProfile().catch(() => null),
      api.getProjects().catch(() => []),
      api.getBlogs(1, 3).then((r) => r.items).catch(() => []),
    ]);
  } catch {}

  const skills = profile?.skills ?? [];
  const skillCategories = Array.from(new Set(skills.map((s) => s.category)));

  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 md:py-32 text-center">
        {profile?.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={profile.name} className="w-24 h-24 rounded-full mx-auto mb-6" />
        )}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          {profile?.name || 'Your Name'}
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-gray-600 dark:text-gray-400">
          {profile?.title || 'Full-Stack Developer'}
        </p>
        <p className="mt-4 max-w-xl mx-auto text-gray-500">{profile?.bio}</p>
        <div className="mt-8 flex justify-center gap-4">
          {profile?.social_links?.github && (
            <a href={profile.social_links.github} target="_blank" rel="noreferrer" className="text-sm underline">GitHub</a>
          )}
          {profile?.social_links?.linkedin && (
            <a href={profile.social_links.linkedin} target="_blank" rel="noreferrer" className="text-sm underline">LinkedIn</a>
          )}
          {profile?.social_links?.email && (
            <a href={`mailto:${profile.social_links.email}`} className="text-sm underline">Email</a>
          )}
        </div>
      </section>

      {/* 技能展示 */}
      {skills.length > 0 && (
        <Section title="技能">
          <div className="grid gap-8 md:grid-cols-3">
            {skillCategories.map((cat) => (
              <div key={cat}>
                <h3 className="font-semibold mb-3">{cat}</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.filter((s) => s.category === cat).map((s) => (
                    <span key={s.name} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 精选项目 */}
      <Section title="精选项目" action={<Link href="/projects" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">查看全部 →</Link>}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 3).map((p) => (
            <Link key={p.id} href={`/projects/${p.slug}`} className="group rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition">
              {p.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover_url} alt={p.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-semibold group-hover:text-blue-500 transition">{p.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.tech_stack.slice(0, 3).map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* 最新博客 */}
      <Section title="最新博客" action={<Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">查看全部 →</Link>}>
        <div className="grid gap-6 md:grid-cols-3">
          {blogs.map((b) => (
            <Link key={b.id} href={`/blog/${b.slug}`} className="group rounded-lg border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg transition">
              <p className="text-xs text-gray-500">{b.published_at?.slice(0, 10)}</p>
              <h3 className="font-semibold mt-1 group-hover:text-blue-500 transition">{b.title}</h3>
              <p className="text-sm text-gray-500 mt-2 line-clamp-3">{b.summary}</p>
            </Link>
          ))}
        </div>
      </Section>

      <SiteFooter />
    </>
  );
}
