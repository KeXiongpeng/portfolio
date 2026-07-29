// web/app/about/page.tsx
import type { Metadata } from 'next';
import { api, resolveAssetUrl } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Markdown } from '@/components/markdown';
import type { Profile } from '@/lib/types';

export const metadata: Metadata = {
  title: '关于我',
  description: '个人介绍、工作经历与教育背景',
};

export default async function AboutPage() {
  let profile: Profile | null = null;
  try {
    profile = await api.getProfile();
  } catch {}

  const name = profile?.name || '';
  const initials = name ? name.slice(0, 2) : '';
  const avatarSrc = resolveAssetUrl(profile?.avatar_url);
  const socials = profile?.social_links;

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
        {/* 头像 + 身份信息卡片 */}
        <section className="mb-14 flex flex-col items-center text-center">
          <div className="relative mb-6">
            {/* 柔光背景 */}
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-blue-500/30 via-cyan-400/20 to-purple-500/30 blur-2xl scale-110" />
            {avatarSrc ? (
              <div className="rounded-full bg-gradient-to-tr from-blue-500 via-cyan-400 to-purple-500 p-[4px] shadow-lg shadow-blue-500/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarSrc}
                  alt={name}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full ring-4 ring-white dark:ring-gray-950 object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-blue-500 via-cyan-400 to-purple-500 p-[4px] shadow-lg shadow-blue-500/20">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-950 ring-4 ring-white dark:ring-gray-950 flex items-center justify-center">
                  <span className="text-4xl md:text-5xl font-bold bg-gradient-to-tr from-blue-500 via-cyan-400 to-purple-500 bg-clip-text text-transparent select-none">
                    {initials || '?'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{name || '关于我'}</h1>
          {profile?.title && (
            <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">{profile.title}</p>
          )}
          {profile?.bio && (
            <p className="mt-4 max-w-xl text-gray-600 dark:text-gray-400 leading-relaxed">{profile.bio}</p>
          )}

          {/* 社交链接 */}
          {(socials?.github || socials?.linkedin || socials?.twitter || socials?.email) && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {socials?.github && (
                <a href={socials.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                  GitHub
                </a>
              )}
              {socials?.linkedin && (
                <a href={socials.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                  LinkedIn
                </a>
              )}
              {socials?.twitter && (
                <a href={socials.twitter} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  Twitter
                </a>
              )}
              {socials?.email && (
                <a href={`mailto:${socials.email}`} className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  Email
                </a>
              )}
            </div>
          )}
        </section>

        {/* 详细介绍 */}
        {profile?.about && (
          <section className="mb-14 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 md:p-8">
            {/* break-words 防止连续长字符串溢出；max-h + overflow-y-auto 内容过多时滚动 */}
            <div className="max-h-[600px] overflow-y-auto break-words">
              <Markdown content={profile.about} />
            </div>
          </section>
        )}

        {/* 工作经历时间线 */}
        {profile && profile.experience.length > 0 && (
          <section className="mb-14">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="h-5 w-1.5 rounded-full bg-blue-500" />
              工作经历
            </h3>
            <ol className="relative border-l border-gray-200 dark:border-gray-800 pl-6 space-y-8">
              {profile.experience.map((e, i) => (
                <li key={i}>
                  <span className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full bg-blue-500 ring-4 ring-gray-50 dark:ring-gray-950" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">{e.period}</p>
                  <h4 className="font-semibold mt-0.5">{e.role} · {e.company}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">{e.description}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 教育背景 */}
        {profile && profile.education.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="h-5 w-1.5 rounded-full bg-blue-500" />
              教育背景
            </h3>
            <div className="space-y-4">
              {profile.education.map((e, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 p-5 transition hover:shadow-md hover:border-blue-500/40">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{e.period}</p>
                  <h4 className="font-semibold mt-0.5">{e.degree} · {e.school}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">{e.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
