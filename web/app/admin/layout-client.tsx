// web/app/admin/layout-client.tsx
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  BulbFilled,
} from '@ant-design/icons';
import { useTheme } from 'next-themes';
import { api } from '@/lib/api';

const { Header, Sider, Content } = Layout;

// 侧边栏宽度范围（用于拖拽）
const MIN_WIDTH = 72;
const MAX_WIDTH = 260;
const DEFAULT_WIDTH = 230;
const COLLAPSE_THRESHOLD = 110;

type MenuItem = { key: string; label: string; icon: React.ReactNode };

const MENUS: MenuItem[] = [
  { key: '/admin/dashboard', label: '仪表盘', icon: <DashboardOutlined /> },
  { key: '/admin/blogs', label: '博客管理', icon: <FileTextOutlined /> },
  { key: '/admin/projects', label: '项目管理', icon: <AppstoreOutlined /> },
  { key: '/admin/profile', label: '个人信息', icon: <UserOutlined /> },
  { key: '/admin/analytics', label: '访客统计', icon: <BarChartOutlined /> },
];

function ThemeToggleBtn() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      type="text"
      icon={theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="切换主题"
    />
  );
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();

  useEffect(() => setMounted(true), []);

  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_WIDTH);

  // 拖拽逻辑
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      startXRef.current = e.clientX;
      startWidthRef.current = collapsed ? MIN_WIDTH : width;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [collapsed, width],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
      setWidth(next);
      if (next <= COLLAPSE_THRESHOLD && !collapsed) setCollapsed(true);
      else if (next > COLLAPSE_THRESHOLD && collapsed) setCollapsed(false);
    };
    const onUp = () => {
      setDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, collapsed]);

  async function logout() {
    await api.logout().catch(() => {});
    // 清除前端域的两个 cookie（token + access_token）
    document.cookie = 'token=; path=/; max-age=0';
    document.cookie = 'access_token=; path=/; max-age=0';
    router.replace('/admin/login');
  }

  // 计算 selectedKeys：支持子路径高亮父级
  const selectedKeys = [MENUS.find((m) => pathname.startsWith(m.key))?.key || pathname];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={width}
        collapsedWidth={MIN_WIDTH}
        trigger={null}
        style={{
          overflow: 'hidden',
          position: 'relative',
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {/* Logo 区域：固定容器 + 绝对定位双层，消除文字切换造成的抖动 */}
        <div
          style={{
            height: 56,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <span
            style={{
              position: 'absolute',
              fontSize: 22,
              fontWeight: 800,
              color: token.colorPrimary,
              opacity: collapsed ? 1 : 0,
              transition: 'opacity 0.2s ease',
              pointerEvents: 'none',
            }}
          >
            P
          </span>
          <span
            style={{
              position: 'absolute',
              whiteSpace: 'nowrap',
              fontSize: 15,
              fontWeight: 700,
              color: token.colorText,
              opacity: collapsed ? 0 : 1,
              transition: 'opacity 0.2s ease',
              pointerEvents: 'none',
            }}
          >
            Portfolio Admin
          </span>
        </div>

        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 'none', background: 'transparent', paddingTop: 8 }}
          items={MENUS.map((m) => ({
            key: m.key,
            icon: m.icon,
            label: m.label,
          }))}
        />

        {/* 拖拽手柄：贴在侧边栏右边缘 */}
        <div
          onMouseDown={onMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 4,
            cursor: 'col-resize',
            zIndex: 10,
            background: dragging ? token.colorPrimary : 'transparent',
            transition: 'background 0.15s',
          }}
          aria-label="拖拽调整侧边栏宽度"
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            height: 56,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="折叠/展开"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {mounted && <ThemeToggleBtn />}
            <Dropdown
              menu={{
                items: [{ key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: logout }],
              }}
            >
              <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>管理员</span>
              </span>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: 12,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
