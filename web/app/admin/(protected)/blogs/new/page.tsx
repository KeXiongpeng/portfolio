// web/app/admin/(protected)/blogs/new/page.tsx
'use client';
import { BlogEditor } from '@/components/admin/blog-editor';

export default function NewBlogPage() {
  return (
    <>
      <h2 style={{ marginBottom: 16 }}>新建文章</h2>
      <BlogEditor />
    </>
  );
}
