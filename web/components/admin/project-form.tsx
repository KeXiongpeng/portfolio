// web/components/admin/project-form.tsx
'use client';
import { useState, useEffect } from 'react';
import { Modal, Form, Input, Switch, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import type { Project } from '@/lib/types';

interface Props {
  open: boolean;
  initial?: Project | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProjectForm({ open, initial, onClose, onSaved }: Props) {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        title: initial.title,
        slug: initial.slug,
        description: initial.description,
        content: initial.content,
        cover_url: initial.cover_url,
        tech_stack: initial.tech_stack.join(', '),
        demo_url: initial.demo_url,
        github_url: initial.github_url,
        is_visible: initial.is_visible,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ is_visible: true });
    }
  }, [initial, form, open]);

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

  async function submit() {
    const values = await form.validateFields();
    const payload = {
      ...values,
      tech_stack: (values.tech_stack as string).split(',').map((t: string) => t.trim()).filter(Boolean),
    };
    if (initial) {
      await api.admin.updateProject(initial.id, payload);
      message.success('已更新');
    } else {
      await api.admin.createProject(payload);
      message.success('已创建');
    }
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} title={initial ? '编辑项目' : '新建项目'} onOk={submit} onCancel={onClose} width={600}>
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="slug" label="slug" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="description" label="简介"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="content" label="详细描述（Markdown）"><Input.TextArea rows={4} /></Form.Item>
        <Form.Item name="tech_stack" label="技术栈（逗号分隔）"><Input placeholder="React, NestJS" /></Form.Item>
        <Form.Item name="demo_url" label="在线链接"><Input /></Form.Item>
        <Form.Item name="github_url" label="GitHub 链接"><Input /></Form.Item>
        <Form.Item name="cover_url" label="封面图 URL">
          <Input />
        </Form.Item>
        <Upload
          beforeUpload={async (file) => { await uploadCover(file); return false; }}
          showUploadList={false}
        >
          <a style={{ opacity: uploading ? 0.5 : 1 }}><UploadOutlined /> {uploading ? '上传中...' : '上传封面'}</a>
        </Upload>
        <Form.Item name="is_visible" label="前台展示" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Modal>
  );
}
