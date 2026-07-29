// web/app/admin/(protected)/projects/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Table, Button, Space, Image, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import { ProjectForm } from '@/components/admin/project-form';
import type { Project } from '@/lib/types';

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  // 原生 HTML5 拖拽：记录正在拖拽的行 id 与悬停目标 id
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setProjects(await api.admin.getProjects());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: number) {
    await api.admin.deleteProject(id);
    message.success('已删除'); load();
  }

  // 原生拖拽排序：交换 dragId 与 overId 的位置
  async function commitReorder(fromId: number, toId: number) {
    if (fromId === toId) return;
    const oldIdx = projects.findIndex((p) => p.id === fromId);
    const newIdx = projects.findIndex((p) => p.id === toId);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = [...projects];
    const [moved] = next.splice(oldIdx, 1);
    next.splice(newIdx, 0, moved);
    setProjects(next);
    await api.admin.reorderProjects(next.map((p, idx) => ({ id: p.id, sort_order: idx })));
    message.success('排序已保存');
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>项目管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true); }}>新建项目</Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={projects}
        onRow={(record) => ({
          draggable: true,
          onDragStart: () => setDragId(record.id),
          onDragOver: (e) => { e.preventDefault(); setOverId(record.id); },
          onDrop: () => {
            if (dragId !== null) commitReorder(dragId, record.id);
            setDragId(null);
            setOverId(null);
          },
          onDragEnd: () => { setDragId(null); setOverId(null); },
        })}
        rowClassName={(record) =>
          record.id === dragId ? 'proj-row-dragging' : record.id === overId ? 'proj-row-over' : ''
        }
        columns={[
          {
            title: '排序', width: 60, align: 'center',
            render: () => <span style={{ cursor: 'grab' }} aria-label="拖拽排序">⋮⋮</span>,
          },
          {
            title: '封面', dataIndex: 'cover_url', width: 100,
            render: (url?: string) => url ? <Image src={url} width={80} alt="项目封面" /> : '-',
          },
          { title: '标题', dataIndex: 'title' },
          {
            title: '技术栈', dataIndex: 'tech_stack',
            render: (ts: string[]) => ts.slice(0, 3).map((t) => <Tag key={t}>{t}</Tag>),
          },
          {
            title: '展示', dataIndex: 'is_visible',
            render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>,
          },
          {
            title: '操作', render: (_, record) => (
              <Space>
                <a onClick={() => { setEditing(record); setModalOpen(true); }}>编辑</a>
                <Popconfirm title="确定删除？" onConfirm={() => remove(record.id)}>
                  <a style={{ color: '#ff4d4f' }}>删除</a>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <style>{`
        .proj-row-dragging { opacity: 0.4; background: #e6f4ff !important; }
        .proj-row-over { border-top: 2px solid #1677ff; }
      `}</style>

      <ProjectForm open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSaved={load} />
    </>
  );
}
