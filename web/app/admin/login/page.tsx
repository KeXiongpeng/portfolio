// web/app/admin/login/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

function LoginInner() {
  const search = useSearchParams();
  const router = useRouter();
  const redirect = search.get('redirect') || '/admin/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 若已登录则直接跳转
  useEffect(() => {
    api.admin.getProfile().then(() => router.replace(redirect)).catch(() => {});
  }, [redirect, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 诊断日志：记录登录开始时的状态
    console.log('=== 登录诊断日志 - 开始 ===');
    console.log('1. redirect 参数:', redirect);
    console.log('2. window.location.href:', window.location.href);
    console.log('3. window.location.host:', window.location.host);
    console.log('4. window.location.hostname:', window.location.hostname);
    console.log('5. NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('6. NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);

    try {
      const { token } = await api.login({ username, password });
      console.log('7. 登录成功，获取到 token');

      // 1) 调 API route 设置 httpOnly token cookie（给 middleware 用）
      await fetch(`/api/auth/set-cookie?token=${encodeURIComponent(token)}`);
      console.log('8. 设置 cookie 成功');

      // 2) 客户端设置可读 access_token cookie（给前端 fetch 的 Authorization header 用）
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `access_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; samesite=lax`;
      console.log('9. 客户端 cookie 设置成功');

      // 3) 使用 window.location 进行硬跳转，避免 Next.js router 的 hostname 问题
      console.log('10. 准备跳转到:', redirect);
      console.log('11. 当前 origin:', window.location.origin);
      console.log('12. 完整跳转 URL:', `${window.location.origin}${redirect}`);
      console.log('=== 登录诊断日志 - 结束 ===');

      // 关键修复：使用 window.location.href 而不是 router.push
      // 确保使用当前页面的 origin，而不是容器 hostname
      window.location.href = redirect;
    } catch (err) {
      console.error('登录失败:', err);
      setError(err instanceof ApiError ? err.message : '登录失败，请重试');
      setLoading(false);
    }
  };

  const loginUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/github`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-xl font-bold mb-1 text-gray-900 text-center">管理后台</h1>
        <p className="text-gray-500 mb-6 text-center text-sm">登录你的账号</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="输入用户名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="输入密码"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-gray-400 text-xs">或使用以下方式</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <a
          href={loginUrl}
          className="block w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-md font-medium transition-colors no-underline text-center"
        >
          使用 GitHub 登录
        </a>

        <p className="text-center text-sm text-gray-500 mt-5">
          没有账号？{' '}
          <Link href="/admin/register" className="text-blue-600 hover:underline">
            去注册
          </Link>
        </p>
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
