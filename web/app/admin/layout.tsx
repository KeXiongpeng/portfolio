// web/app/admin/layout.tsx
import { ReactNode } from 'react';
import { AntdRegistryProvider } from '@/components/antd-registry';

export default function AdminLayout({ children }: { children: ReactNode }) {
  // 登录页（/admin/login）不需要侧边栏，通过 children 自身渲染；
  // 其他 /admin/* 页面在各自的 layout/page 里使用 AdminLayoutClient。
  // 这里统一注入 AntD Registry。
  return <AntdRegistryProvider>{children}</AntdRegistryProvider>;
}
