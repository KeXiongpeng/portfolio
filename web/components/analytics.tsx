'use client';

// Vercel Analytics / Speed Insights 客户端包装
// 暂时禁用，避免 /_vercel/insights/script.js 404 影响页面交互
// 待 Vercel 项目面板启用 Analytics 后再恢复
export function Analytics() {
  return null;

  // 启用时取消下方注释：
  // import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
  // import { SpeedInsights } from '@vercel/speed-insights/next';
  // return (
  //   <>
  //     <VercelAnalytics />
  //     <SpeedInsights />
  //   </>
  // );
}
