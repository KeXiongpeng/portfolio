// web/components/charts/pv-line.tsx
'use client';
import { Line } from '@ant-design/charts';

export function PvLine({ data }: { data: { date: string; pv: number }[] }) {
  return (
    <Line
      data={data}
      xField="date"
      yField="pv"
      height={300}
      smooth
      point={{ size: 4, shape: 'circle' }}
      tooltip={{ showMarkers: false }}
    />
  );
}
