// web/app/admin/(protected)/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { api } from '@/lib/api';
import { PvLine } from '@/components/charts/pv-line';
import type { Analytics, Blog } from '@/lib/types';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.admin.getAnalytics().catch(() => null),
      api.admin.getBlogs().catch(() => []),
    ]).then(([a, b]) => {
      setAnalytics(a);
      setBlogs(b);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spin />;

  // 最近 7 天数据
  const weekData = (analytics?.dailyStats ?? [])
    .slice(-7)
    .map((s) => ({ date: s.date.slice(5), pv: s.pv }));

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">仪表盘</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card><Statistic title="总访问量" value={analytics?.totalPv ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="今日 PV" value={analytics?.todayPv ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="在线人数" value={analytics?.online ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="博客数量" value={blogs.length} /></Card>
        </Col>
      </Row>

      <Card title="最近 7 天 PV" className="mt-4">
        {weekData.length > 0 ? <PvLine data={weekData} /> : <p>暂无数据</p>}
      </Card>
    </>
  );
}
