// web/app/admin/login/page.tsx
'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

function LoginInner() {
  const search = useSearchParams();
  const router = useRouter();
  const redirect = search.get('redirect') || '/admin/dashboard';

  // 若已登录则直接跳转
  useEffect(() => {
    api.admin.getProfile().then(() => router.replace(redirect)).catch(() => {});
  }, [redirect, router]);

  const loginUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/github`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-96 text-center bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-xl font-bold mb-2 text-gray-900">管理后台</h1>
        <p className="text-gray-500 mb-6">使用 GitHub 账号登录</p>
        {/* 用原生 a 标签，避免 React hydration 问题导致 onClick 不触发 */}
        <a
          href={loginUrl}
          className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors no-underline"
        >
          使用 GitHub 登录
        </a>
      </div>
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
