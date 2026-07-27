// web/app/admin/(protected)/layout.tsx
import { ReactNode } from 'react';
import { AdminLayoutClient } from '@/app/admin/layout-client';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
