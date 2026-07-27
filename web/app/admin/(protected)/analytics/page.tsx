// web/app/admin/(protected)/analytics/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { api } from '@/lib/api';
import { PvLine } from '@/components/charts/pv-line';
import type { Analytics } from '@/lib/types';

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getAnalytics().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <Spin />;

  const monthData = (data?.dailyStats ?? []).map((s) => ({ date: s.date.slice(5), pv: s.pv }));

  return (
    <>
      <h2 style={{ marginBottom: 16 }}>访客统计</h2>
      <Row gutter={[16, 16]}>
        <Col span={6}><Card><Statistic title="总访问量" value={data?.totalPv ?? 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="今日 PV" value={data?.todayPv ?? 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="本周 PV" value={data?.weekPv ?? 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="本月 PV" value={data?.monthPv ?? 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="在线人数" value={data?.online ?? 0} /></Card></Col>
      </Row>

      <Card title="最近 30 天 PV" style={{ marginTop: 16 }}>
        {monthData.length > 0 ? <PvLine data={monthData} /> : <p>暂无数据</p>}
      </Card>
    </>
  );
}
