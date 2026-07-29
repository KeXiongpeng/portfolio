// web/components/section.tsx
import { ReactNode } from 'react';

export function Section({
  title, children, action,
}: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      {(title || action) && (
        <div className="mb-10 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div className="flex items-center justify-between gap-4">
            {title && (
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                <span className="h-6 w-1.5 rounded-full bg-blue-500" />
                {title}
              </h2>
            )}
            {action}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}
