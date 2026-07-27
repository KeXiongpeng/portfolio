// web/app/admin/layout-client.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';

const { Header, Sider, Content } = Layout;

const MENUS = [
  { key: '/admin/dashboard', label: '仪表盘' },
  { key: '/admin/blogs', label: '博客管理' },
  { key: '/admin/projects', label: '项目管理' },
  { key: '/admin/profile', label: '个人信息' },
  { key: '/admin/analytics', label: '访客统计' },
];

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();

  const current = '/' + pathname.split('/').slice(0, 3).join('/').split('/').filter(Boolean).slice(0, 2).join('/');

  async function logout() {
    await api.logout().catch(() => {});
    router.replace('/admin/login');
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ height: 48, color: '#fff', textAlign: 'center', lineHeight: '48px', fontWeight: 600 }}>
          {collapsed ? 'P' : 'Portfolio Admin'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={MENUS.map((m) => ({ key: m.key, label: <Link href={m.key}>{m.label}</Link> }))}
        />
      </Sider>
      <Layout>
        <Header style={{ background: token.colorBgContainer, padding: '0 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: [{ key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: logout }] }}>
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>管理员</span>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: token.colorBgContainer, borderRadius: 8 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
