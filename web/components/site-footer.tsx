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
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Your Name. All rights reserved.</p>
        <p>总访问量：{total.toLocaleString()}</p>
        <nav className="flex gap-4">
          <Link href="/contact">联系我</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
