// web/lib/fingerprint.ts
export function getFingerprint(): string {
  if (typeof window === 'undefined') return 'ssr';
  const parts = [
    navigator.userAgent,
    navigator.language,
    (navigator.languages || []).join(','),
    String(screen.width) + 'x' + String(screen.height),
    new Date().getTimezoneOffset().toString(),
  ];
  let hash = 0;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
