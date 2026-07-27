// web/components/section.tsx
import { ReactNode } from 'react';

export function Section({
  title, children, action,
}: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="container mx-auto px-4 py-12">
      {(title || action) && (
        <div className="flex items-center justify-between mb-6">
          {title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
