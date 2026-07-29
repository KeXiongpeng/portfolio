// web/app/page.tsx
import Link from 'next/link';
import { api, resolveAssetUrl } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Section } from '@/components/section';
import { JsonLd } from '@/components/json-ld';
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

  const socialBtn =
    'inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm';

  return (
    <>
      {profile && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: profile.name,
            jobTitle: profile.title,
            description: profile.bio,
            url: process.env.NEXT_PUBLIC_SITE_URL,
            image: profile.avatar_url,
            sameAs: [
              profile.social_links?.github,
              profile.social_links?.linkedin,
              profile.social_links?.twitter,
            ].filter(Boolean),
            knowsAbout: profile.skills?.map((s) => s.name),
          }}
        />
      )}
      <SiteHeader />

      {/* Hero */}
      <section className="container mx-auto px-4 py-28 md:py-40 text-center">
        {profile?.avatar_url && (
          <div className="mx-auto mb-10 w-fit">
            <div className="rounded-full bg-gradient-to-tr from-blue-500 via-cyan-400 to-purple-500 p-[3px] shadow-lg shadow-blue-500/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveAssetUrl(profile.avatar_url)}
                alt={profile.name}
                className="w-28 h-28 md:w-32 md:h-32 rounded-full ring-4 ring-gray-50 dark:ring-gray-950 object-cover"
              />
            </div>
          </div>
        )}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
          {profile?.name || 'Your Name'}
        </h1>
        <p className="mt-6 text-xl md:text-2xl font-medium text-gray-600 dark:text-gray-400">
          {profile?.title || 'Full-Stack Developer'}
        </p>
        {profile?.bio && (
          <p className="mt-5 max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-gray-500 dark:text-gray-400">
            {profile.bio}
          </p>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {profile?.social_links?.github && (
            <a href={profile.social_links.github} target="_blank" rel="noreferrer" className={socialBtn}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub
            </a>
          )}
          {profile?.social_links?.linkedin && (
            <a href={profile.social_links.linkedin} target="_blank" rel="noreferrer" className={socialBtn}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              LinkedIn
            </a>
          )}
          {profile?.social_links?.twitter && (
            <a href={profile.social_links.twitter} target="_blank" rel="noreferrer" className={socialBtn}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter
            </a>
          )}
          {profile?.social_links?.email && (
            <a href={`mailto:${profile.social_links.email}`} className={socialBtn}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Email
            </a>
          )}
        </div>
      </section>

      {/* 技能展示 */}
      {skills.length > 0 && (
        <Section title="技能">
          <div className="grid gap-8 md:grid-cols-3">
            {skillCategories.map((cat) => (
              <div key={cat} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <h3 className="font-semibold text-lg mb-4">{cat}</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.filter((s) => s.category === cat).map((s) => (
                    <span
                      key={s.name}
                      className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 transition hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400"
                    >
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
      <Section title="精选项目" action={<Link href="/projects" className="text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition">查看全部 →</Link>}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 3).map((p) => (
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
                  {p.tech_stack.slice(0, 3).map((t) => (
                    <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* 最新博客 */}
      <Section title="最新博客" action={<Link href="/blog" className="text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition">查看全部 →</Link>}>
        <div className="grid gap-6 md:grid-cols-3">
          {blogs.map((b) => (
            <Link
              key={b.id}
              href={`/blog/${b.slug}`}
              className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 transition-all duration-300 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:-translate-y-0.5"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">{b.published_at?.slice(0, 10)}</p>
              <h3 className="font-semibold mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{b.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-3">{b.summary}</p>
            </Link>
          ))}
        </div>
      </Section>

      <SiteFooter />
    </>
  );
}
