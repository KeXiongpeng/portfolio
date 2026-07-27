// web/app/admin/(protected)/blogs/[id]/edit/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Spin } from 'antd';
import { api } from '@/lib/api';
import { BlogEditor } from '@/components/admin/blog-editor';
import type { Blog } from '@/lib/types';

export default function EditBlogPage() {
  const params = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getBlogs().then((list) => {
      setBlog(list.find((b) => b.id === parseInt(params.id, 10)) || null);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) return <Spin />;
  if (!blog) return <p>文章不存在</p>;
  return (
    <>
      <h2 style={{ marginBottom: 16 }}>编辑文章</h2>
      <BlogEditor initial={blog} />
    </>
  );
}
