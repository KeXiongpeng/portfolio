// web/components/json-ld.tsx
// 在页面 <head> 中注入结构化数据。Server Component 中使用。
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
