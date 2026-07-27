// web/app/admin/login/page.tsx
'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Card } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';

function LoginInner() {
  const search = useSearchParams();
  const router = useRouter();
  const redirect = search.get('redirect') || '/admin/dashboard';

  // 若已登录则直接跳转
  useEffect(() => {
    api.admin.getProfile().then(() => router.replace(redirect)).catch(() => {});
  }, [redirect, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Card className="w-96 text-center">
        <h1 className="text-xl font-bold mb-2 text-white">管理后台</h1>
        <p className="text-gray-400 mb-6">使用 GitHub 账号登录</p>
        <Button type="primary" size="large" icon={<GithubOutlined />} block onClick={() => api.loginGithub()}>
          使用 GitHub 登录
        </Button>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
