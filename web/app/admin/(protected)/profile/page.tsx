// web/app/admin/(protected)/profile/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Form, Input, Button, message, Spin, Divider } from 'antd';
import { api } from '@/lib/api';
import type { Profile } from '@/lib/types';

export default function ProfileAdminPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.admin.getProfile().then((p) => {
      form.setFieldsValue({
        name: p.name,
        title: p.title,
        bio: p.bio,
        about: p.about,
        avatar_url: p.avatar_url,
        github: p.social_links?.github,
        linkedin: p.social_links?.linkedin,
        email: p.social_links?.email,
        twitter: p.social_links?.twitter,
      });
      setLoading(false);
    });
  }, [form]);

  async function save() {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await api.admin.updateProfile({
        name: v.name,
        title: v.title,
        bio: v.bio,
        about: v.about,
        avatar_url: v.avatar_url,
        social_links: {
          github: v.github, linkedin: v.linkedin, email: v.email, twitter: v.twitter,
        },
      });
      message.success('已保存');
    } catch (err: any) {
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spin />;

  return (
    <>
      <h2 style={{ marginBottom: 16 }}>个人信息</h2>
      <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="title" label="职位标题" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="bio" label="一句话介绍"><Input /></Form.Item>
        <Form.Item name="avatar_url" label="头像 URL"><Input /></Form.Item>
        <Form.Item name="about" label="详细介绍（Markdown）"><Input.TextArea rows={6} /></Form.Item>

        <Divider>社交链接</Divider>
        <Form.Item name="github" label="GitHub"><Input /></Form.Item>
        <Form.Item name="linkedin" label="LinkedIn"><Input /></Form.Item>
        <Form.Item name="email" label="Email"><Input /></Form.Item>
        <Form.Item name="twitter" label="Twitter"><Input /></Form.Item>

        <Button type="primary" loading={saving} onClick={save}>保存</Button>
      </Form>
      <p style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
        注：技能、工作经历、教育背景等复杂数组字段可通过数据库直接编辑或后续扩展管理界面。
      </p>
    </>
  );
}
