// web/components/antd-registry.tsx
'use client';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { ReactNode, useState, useEffect } from 'react';

// 监听 html class 变化，动态切换 Ant Design 算法（联动 next-themes）
function DynamicConfigProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    // 初始同步
    setIsDark(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 8,
          fontSize: 14,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export function AntdRegistryProvider({ children }: { children: ReactNode }) {
  return (
    <AntdRegistry>
      <DynamicConfigProvider>{children}</DynamicConfigProvider>
    </AntdRegistry>
  );
}
