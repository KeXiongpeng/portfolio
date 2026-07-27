// web/components/admin/blog-editor.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Space, message } from 'antd';
import { api } from '@/lib/api';
import { Markdown } from '@/components/markdown';
import type { Blog } from '@/lib/types';

export function BlogEditor({ initial }: { initial?: Blog }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [content, setContent] = useState(initial?.content || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        title: initial.title,
        slug: initial.slug,
        summary: initial.summary,
        tags: initial.tags.join(', '),
      });
    }
  }, [initial, form]);

  async function save(status: 'draft' | 'published') {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        title: values.title,
        slug: values.slug,
        summary: values.summary,
        tags: (values.tags as string).split(',').map((t) => t.trim()).filter(Boolean),
        content,
      };
      if (initial) {
        await api.admin.updateBlog(initial.id, payload);
        if (status === 'published' && initial.status !== 'published') {
          await api.admin.publishBlog(initial.id);
        } else if (status === 'draft' && initial.status === 'published') {
          await api.admin.unpublishBlog(initial.id);
        }
      } else {
        const created = await api.admin.createBlog(payload);
        if (status === 'published') await api.admin.publishBlog(created.id);
      }
      message.success(status === 'published' ? '已发布' : '已保存草稿');
      router.push('/admin/blogs');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ required: true }]}>
          <Input placeholder="文章标题" />
        </Form.Item>
        <Form.Item name="slug" label="slug" rules={[{ required: true }]}>
          <Input placeholder="url-friendly-slug" />
        </Form.Item>
        <Form.Item name="summary" label="摘要">
          <Input.TextArea rows={2} placeholder="一句话摘要" />
        </Form.Item>
        <Form.Item name="tags" label="标签（逗号分隔）">
          <Input placeholder="React, NestJS, Docker" />
        </Form.Item>
      </Form>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: 500 }}>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>正文（Markdown）</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: '100%', height: '100%', resize: 'none', fontFamily: 'monospace', padding: 12, borderRadius: 6, border: '1px solid #444', background: '#1f1f1f', color: '#eee' }}
          />
        </div>
        <div style={{ overflow: 'auto', border: '1px solid #444', borderRadius: 6, padding: 12 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>预览</div>
          <Markdown content={content} />
        </div>
      </div>

      <Space style={{ marginTop: 16 }}>
        <Button onClick={() => router.push('/admin/blogs')}>取消</Button>
        <Button loading={saving} onClick={() => save('draft')}>保存草稿</Button>
        <Button type="primary" loading={saving} onClick={() => save('published')}>发布</Button>
      </Space>
    </>
  );
}
