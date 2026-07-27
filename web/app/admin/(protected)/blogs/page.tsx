// web/app/admin/(protected)/blogs/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Space, Tag, Input, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import type { Blog } from '@/lib/types';

export default function BlogsAdminPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  async function load() {
    setLoading(true);
    const data = await api.admin.getBlogs();
    setBlogs(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function publish(id: number) {
    await api.admin.publishBlog(id);
    message.success('已发布'); load();
  }
  async function unpublish(id: number) {
    await api.admin.unpublishBlog(id);
    message.success('已下线'); load();
  }
  async function remove(id: number) {
    await api.admin.deleteBlog(id);
    message.success('已删除'); load();
  }

  const filtered = blogs.filter((b) => b.title.toLowerCase().includes(keyword.toLowerCase()));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>博客管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/admin/blogs/new')}>新建文章</Button>
      </div>

      <Input.Search placeholder="搜索标题" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ marginBottom: 16, maxWidth: 300 }} />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        columns={[
          { title: '标题', dataIndex: 'title' },
          {
            title: '标签', dataIndex: 'tags', render: (tags: string[]) => tags.map((t) => <Tag key={t}>{t}</Tag>),
          },
          {
            title: '状态', dataIndex: 'status', render: (s: string) => (
              <Tag color={s === 'published' ? 'green' : 'default'}>{s === 'published' ? '已发布' : '草稿'}</Tag>
            ),
          },
          { title: '创建时间', dataIndex: 'created_at', render: (t: string) => t.slice(0, 10) },
          {
            title: '操作', render: (_, record) => (
              <Space>
                <a onClick={() => router.push(`/admin/blogs/${record.id}/edit`)}>编辑</a>
                {record.status === 'draft' ? (
                  <a onClick={() => publish(record.id)}>发布</a>
                ) : (
                  <a onClick={() => unpublish(record.id)}>下线</a>
                )}
                <Popconfirm title="确定删除？" onConfirm={() => remove(record.id)}>
                  <a style={{ color: '#ff4d4f' }}>删除</a>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </>
  );
}
