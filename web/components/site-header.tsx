// web/components/site-header.tsx
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

const NAV = [
  { href: '/', label: '首页' },
  { href: '/about', label: '关于' },
  { href: '/projects', label: '项目' },
  { href: '/blog', label: '博客' },
  { href: '/contact', label: '联系' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 backdrop-blur bg-white/80 dark:bg-gray-950/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-bold tracking-tight">Your Name</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
      {/* 移动端横向滚动导航 */}
      <nav className="md:hidden flex items-center gap-4 overflow-x-auto px-4 pb-2 text-sm">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="whitespace-nowrap text-gray-600 dark:text-gray-400">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
