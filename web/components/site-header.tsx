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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 backdrop-blur-md bg-white/80 dark:bg-gray-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight transition hover:text-blue-600 dark:hover:text-blue-400">
          Portfolio
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
      {/* 移动端横向滚动导航 */}
      <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2 text-sm">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="whitespace-nowrap px-3 py-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-100 transition"
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
