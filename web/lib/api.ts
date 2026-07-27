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

export async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    // Server Components 中需强制动态获取，避免缓存
    cache: options.cache ?? 'no-store',
  });

  if (!res.ok) {
    const msg = (await res.json().catch(() => ({ message: 'Request failed' }))) as { message?: string };
    throw new ApiError(res.status, msg.message || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // 公开接口
  getProfile: () => fetchApi<Profile>('/api/profile'),
  getProjects: (tag?: string) =>
    fetchApi<Project[]>(`/api/projects${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`),
  getProject: (slug: string) => fetchApi<Project>(`/api/projects/${slug}`),
  getBlogs: (page = 1, limit = 10, tag?: string) =>
    fetchApi<BlogListResponse>(`/api/blogs?page=${page}&limit=${limit}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`),
  getBlog: (slug: string) => fetchApi<Blog>(`/api/blogs/${slug}`),
  submitContact: (data: { name: string; email: string; message: string }) =>
    fetchApi<void>('/api/contact', { method: 'POST', body: JSON.stringify(data) }),
  trackVisit: (fingerprint: string) =>
    fetchApi<void>('/api/visit/track', { method: 'POST', body: JSON.stringify({ fingerprint }) }),
  getVisitCount: () => fetchApi<{ total: number }>('/api/visit/count'),
  loginGithub: () => {
    window.location.href = `${API_URL}/api/auth/github`;
  },
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
