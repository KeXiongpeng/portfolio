// web/app/about/page.tsx
import type { Metadata } from 'next';
import { api } from '@/lib/api';
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

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">关于我</h1>

        <div className="flex items-start gap-6 mb-12">
          {profile?.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.name} className="w-28 h-28 rounded-full" />
          )}
          <div>
            <h2 className="text-xl font-semibold">{profile?.name}</h2>
            <p className="text-gray-500">{profile?.title}</p>
            {profile?.about && <div className="mt-4"><Markdown content={profile.about} /></div>}
          </div>
        </div>

        {/* 工作经历时间线 */}
        {profile && profile.experience.length > 0 && (
          <section className="mb-12">
            <h3 className="text-xl font-semibold mb-4">工作经历</h3>
            <ol className="relative border-l border-gray-200 dark:border-gray-800 pl-6 space-y-6">
              {profile.experience.map((e, i) => (
                <li key={i}>
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-blue-500" />
                  <p className="text-sm text-gray-500">{e.period}</p>
                  <h4 className="font-semibold">{e.role} · {e.company}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{e.description}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 教育背景 */}
        {profile && profile.education.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold mb-4">教育背景</h3>
            <div className="space-y-4">
              {profile.education.map((e, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-500">{e.period}</p>
                  <h4 className="font-semibold">{e.degree} · {e.school}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{e.description}</p>
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
