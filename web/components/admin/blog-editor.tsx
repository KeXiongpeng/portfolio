// web/components/admin/blog-editor.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Space, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import MDEditor from '@/components/admin/md-editor-wrapper';
import { commands as mdCommands } from '@uiw/react-md-editor';
import type { ICommand } from '@uiw/react-md-editor';
import type { Blog } from '@/lib/types';

// ===== 自定义对齐命令（Markdown 不支持原生对齐，用 HTML <div align> 实现）=====

const alignLeft: ICommand = {
  name: 'align-left',
  keyCommand: 'alignLeft',
  buttonProps: { 'aria-label': '左对齐', title: '左对齐' },
  icon: <span style={{ fontSize: 14 }}>⬅</span>,
  execute: (state, api) => {
    const inner = state.selectedText || '左对齐内容';
    api.replaceSelection(`<div align="left">\n\n${inner}\n\n</div>\n`);
  },
};

const alignCenter: ICommand = {
  name: 'align-center',
  keyCommand: 'alignCenter',
  buttonProps: { 'aria-label': '居中对齐', title: '居中对齐' },
  icon: <span style={{ fontSize: 14 }}>⬄</span>,
  execute: (state, api) => {
    const inner = state.selectedText || '居中内容';
    api.replaceSelection(`<div align="center">\n\n${inner}\n\n</div>\n`);
  },
};

const alignRight: ICommand = {
  name: 'align-right',
  keyCommand: 'alignRight',
  buttonProps: { 'aria-label': '右对齐', title: '右对齐' },
  icon: <span style={{ fontSize: 14 }}>⬆</span>,
  execute: (state, api) => {
    const inner = state.selectedText || '右对齐内容';
    api.replaceSelection(`<div align="right">\n\n${inner}\n\n</div>\n`);
  },
};

export function BlogEditor({ initial }: { initial?: Blog }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [content, setContent] = useState(initial?.content || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        title: initial.title,
        slug: initial.slug,
        summary: initial.summary,
        tags: initial.tags.join(', '),
        cover_url: initial.cover_url || '',
      });
    }
  }, [initial, form]);

  async function uploadCover(file: File): Promise<string> {
    setUploading(true);
    try {
      const res = await api.admin.uploadImage(file);
      form.setFieldValue('cover_url', res.url);
      message.success('封面上传成功');
      return res.url;
    } catch {
      message.error('封面上传失败');
      throw new Error('upload failed');
    } finally {
      setUploading(false);
    }
  }

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
        cover_url: values.cover_url,
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
        <Form.Item name="cover_url" label="封面图 URL">
          <Input placeholder="https://example.com/cover.jpg" />
        </Form.Item>
        <Upload
          beforeUpload={async (file) => { await uploadCover(file); return false; }}
          showUploadList={false}
        >
          <a style={{ opacity: uploading ? 0.5 : 1 }}><UploadOutlined /> {uploading ? '上传中...' : '上传封面'}</a>
        </Upload>
      </Form>

      <div style={{ marginBottom: 8, fontWeight: 500 }}>正文（Markdown）</div>
      {/* @uiw/react-md-editor：内置白色工具栏 + 左右分栏（编辑 + 预览） */}
      <div data-color-mode="light">
        <MDEditor
          value={content}
          onChange={(val) => setContent(val || '')}
          height={560}
          // 保留全部默认命令（标题/加粗/斜体/列表/引用/代码/链接/图片等），再追加 3 个对齐按钮
          commands={[...mdCommands.getCommands(), alignLeft, alignCenter, alignRight]}
          previewOptions={{
            // 让编辑器内的预览也能渲染对齐用的 HTML
            rehypePlugins: [],
          }}
          style={{ background: '#fff' }}
        />
      </div>

      <Space style={{ marginTop: 16 }}>
        <Button onClick={() => router.push('/admin/blogs')}>取消</Button>
        <Button loading={saving} onClick={() => save('draft')}>保存草稿</Button>
        <Button type="primary" loading={saving} onClick={() => save('published')}>发布</Button>
      </Space>
    </>
  );
}
