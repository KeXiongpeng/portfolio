// web/components/visit-tracker.tsx
'use client';
import { useEffect } from 'react';
import { trackVisit } from '@/lib/api';
import { getFingerprint } from '@/lib/fingerprint';

export function VisitTracker() {
  useEffect(() => {
    const fp = getFingerprint();
    // 通过 sessionStorage 防止短时间重复上报
    const key = `visit:${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    trackVisit(fp).catch(() => {});
  }, []);
  return null;
}
