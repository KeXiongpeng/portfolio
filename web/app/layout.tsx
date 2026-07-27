// web/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { VisitTracker } from '@/components/visit-tracker';
import { api } from '@/lib/api';
import { JsonLd } from '@/components/json-ld';

const inter = Inter({ subsets: ['latin'] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Your Name | Full-Stack Developer',
    template: '%s | Your Name',
  },
  description: '个人作品集与博客',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
    siteName: 'Your Name',
    title: 'Your Name | Full-Stack Developer',
    description: '个人作品集与博客',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Name | Full-Stack Developer',
    description: '个人作品集与博客',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await api.getProfile().catch(() => null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: profile?.name || 'Your Name',
    url: siteUrl,
    description: profile?.bio || '个人作品集与博客',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/blog?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <JsonLd data={websiteSchema} />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <VisitTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
