// web/app/admin/(protected)/projects/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Table, Button, Space, Image, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api';
import { ProjectForm } from '@/components/admin/project-form';
import type { Project } from '@/lib/types';

function DraggableRow(props: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  });
  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    background: isDragging ? '#e6f4ff' : undefined,
  };
  return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />;
}

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

  async function onDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = projects.findIndex((p) => p.id === active.id);
    const newIdx = projects.findIndex((p) => p.id === over.id);
    const next = arrayMove(projects, oldIdx, newIdx);
    setProjects(next);
    // 立即同步排序到后端
    await api.admin.reorderProjects(next.map((p, idx) => ({ id: p.id, sort_order: idx })));
    message.success('排序已保存');
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>项目管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true); }}>新建项目</Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={projects}
            components={{ body: { row: DraggableRow } }}
            columns={[
              {
                title: '封面', dataIndex: 'cover_url', width: 100,
                render: (url?: string) => url ? <Image src={url} width={80} /> : '-',
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
        </SortableContext>
      </DndContext>

      <ProjectForm open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSaved={load} />
    </>
  );
}
