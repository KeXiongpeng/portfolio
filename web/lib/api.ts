// web/lib/api.ts
import type {
  Profile, Project, Blog, BlogListResponse,
  ContactMessage, Analytics,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// 把后端返回的相对资源路径（如 /uploads/xxx）补全为完整的后端 URL，
// 否则在前台页面（端口 3000）会解析成 3000 而访问不到后端（3001）的资源。
export function resolveAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url; // 已是完整 URL（如 GitHub 头像）
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

// 读取可读 cookie（由 /api/auth/set-cookie 设置的 access_token）
// Vercel 跨域部署下 api 域 cookie 丢失，改用 Authorization header 携带 token
function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // FormData 时不手动设置 Content-Type，交给浏览器自动加上 multipart boundary
  const isFormData = options.body instanceof FormData;
  // 计算最终的 cache 策略：
  // - 显式传了 cache 就用传入值
  // - 传了 next.revalidate 等 ISR 选项时不设 cache（避免与 no-store 冲突）
  // - 否则默认 no-store，保证管理端数据实时
  const hasNextRevalidate = options.next && 'revalidate' in (options.next as object);
  const finalCache = options.cache ?? (hasNextRevalidate ? undefined : 'no-store');

  // 附加 Authorization header（跨域部署的认证方式）
  const token = getAccessToken();
  const headers: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // 合并调用方传入的 headers（允许覆盖）
  const userHeaders = (options.headers as Record<string, string>) || {};
  Object.keys(userHeaders).forEach((k) => { headers[k] = userHeaders[k]; });

  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers,
    ...options,
    ...(finalCache ? { cache: finalCache } : {}),
  });

  if (!res.ok) {
    const msg = (await res.json().catch(() => ({ message: 'Request failed' }))) as { message?: string };
    throw new ApiError(res.status, msg.message || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // 公开接口（短时缓存，让前台导航即时响应，30s 后自动重新校验）
  getProfile: () => fetchApi<Profile>('/api/profile', { next: { revalidate: 30 } }),
  getProjects: (tag?: string) =>
    fetchApi<Project[]>(`/api/projects${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`, { next: { revalidate: 30 } }),
  getProject: (slug: string) => fetchApi<Project>(`/api/projects/${slug}`, { next: { revalidate: 30 } }),
  getBlogs: (page = 1, limit = 10, tag?: string) =>
    fetchApi<BlogListResponse>(`/api/blogs?page=${page}&limit=${limit}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`, { next: { revalidate: 30 } }),
  getBlog: (slug: string) => fetchApi<Blog>(`/api/blogs/${slug}`, { next: { revalidate: 30 } }),
  submitContact: (data: { name: string; email: string; message: string }) =>
    fetchApi<void>('/api/contact', { method: 'POST', body: JSON.stringify(data) }),
  trackVisit: (fingerprint: string) =>
    fetchApi<void>('/api/visit/track', { method: 'POST', body: JSON.stringify({ fingerprint }) }),
  getVisitCount: () => fetchApi<{ total: number }>('/api/visit/count'),
  loginGithub: () => {
    window.location.href = `${API_URL}/api/auth/github`;
  },
  register: (data: { username: string; email: string; password: string }) =>
    fetchApi<{ token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { username: string; password: string }) =>
    fetchApi<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => fetchApi<void>('/api/auth/logout', { method: 'POST' }),

  // 管理接口
  admin: {
    getBlogs: () => fetchApi<Blog[]>('/api/admin/blogs'),
    createBlog: (data: Partial<Blog>) =>
      fetchApi<Blog>('/api/admin/blogs', { method: 'POST', body: JSON.stringify(data) }),
    updateBlog: (id: number, data: Partial<Blog>) =>
      fetchApi<Blog>(`/api/admin/blogs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteBlog: (id: number) =>
      fetchApi<void>(`/api/admin/blogs/${id}`, { method: 'DELETE' }),
    publishBlog: (id: number) =>
      fetchApi<Blog>(`/api/admin/blogs/${id}/publish`, { method: 'PATCH' }),
    unpublishBlog: (id: number) =>
      fetchApi<Blog>(`/api/admin/blogs/${id}/unpublish`, { method: 'PATCH' }),

    getProjects: () => fetchApi<Project[]>('/api/admin/projects'),
    createProject: (data: Partial<Project>) =>
      fetchApi<Project>('/api/admin/projects', { method: 'POST', body: JSON.stringify(data) }),
    updateProject: (id: number, data: Partial<Project>) =>
      fetchApi<Project>(`/api/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProject: (id: number) =>
      fetchApi<void>(`/api/admin/projects/${id}`, { method: 'DELETE' }),
    reorderProjects: (items: { id: number; sort_order: number }[]) =>
      fetchApi<{ success: boolean }>('/api/admin/projects/reorder', {
        method: 'PUT', body: JSON.stringify({ items }),
      }),

    getProfile: () => fetchApi<Profile>('/api/admin/profile'),
    updateProfile: (data: Partial<Profile>) =>
      fetchApi<Profile>('/api/admin/profile', { method: 'PUT', body: JSON.stringify(data) }),

    uploadImage: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return fetchApi<{ url: string }>('/api/admin/upload', { method: 'POST', body: form });
    },

    getAnalytics: () => fetchApi<Analytics>('/api/admin/analytics'),
    getContacts: () => fetchApi<ContactMessage[]>('/api/admin/contacts'),
    markContactRead: (id: number) =>
      fetchApi<ContactMessage>(`/api/admin/contacts/${id}/read`, { method: 'PATCH' }),
  },
};

// Standalone named exports for direct import (e.g. visit-tracker.tsx, site-footer.tsx).
// The same calls are also available as api.trackVisit / api.getVisitCount.
export const trackVisit = (fingerprint: string) =>
  fetchApi<void>('/api/visit/track', { method: 'POST', body: JSON.stringify({ fingerprint }) });

export const getVisitCount = () => fetchApi<{ total: number }>('/api/visit/count');

export { ApiError };
