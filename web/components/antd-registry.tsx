// web/components/antd-registry.tsx
'use client';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { ReactNode } from 'react';

export function AntdRegistryProvider({ children }: { children: ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: antdTheme.darkAlgorithm,
          token: { colorPrimary: '#3b82f6' },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
