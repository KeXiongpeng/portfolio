// web/components/contact-form.tsx
'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await api.submitContact(form);
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : '提交失败，请稍后再试');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 p-6 text-center">
        <p className="font-semibold">提交成功，感谢您的留言！</p>
        <button onClick={() => setStatus('idle')} className="mt-3 text-sm underline">再次提交</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">姓名</label>
        <input
          required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">邮箱</label>
        <input
          required type="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">消息内容</label>
        <textarea
          required rows={6} value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
        />
      </div>
      {status === 'error' && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit" disabled={status === 'loading'}
        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {status === 'loading' ? '提交中...' : '提交'}
      </button>
    </form>
  );
}
