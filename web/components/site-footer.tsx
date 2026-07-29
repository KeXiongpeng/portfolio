// web/components/site-footer.tsx
import Link from 'next/link';

export async function SiteFooter() {
  let total = 0;
  try {
    const { getVisitCount } = await import('@/lib/api');
    const data = await getVisitCount();
    total = data.total;
  } catch {}

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-20 bg-white/60 dark:bg-gray-950/60">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2 text-center md:text-left">
            <span>© {new Date().getFullYear()} Portfolio</span>
            <span className="hidden md:inline text-gray-300 dark:text-gray-700">·</span>
            <span className="hidden md:inline">总访问量 {total.toLocaleString()}</span>
          </div>

          <p className="md:hidden">总访问量 {total.toLocaleString()}</p>

          <nav className="flex items-center gap-1">
            <Link
              href="/contact"
              className="px-3 py-1.5 rounded-md transition hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/80"
            >
              联系我
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-md transition hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/80"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
