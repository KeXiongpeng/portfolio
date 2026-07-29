'use client';
// Next.js App Router 下 @uiw/react-md-editor 必须动态加载（ssr:false），
// 因为它依赖浏览器 API（document/window），服务端渲染会报错。
import dynamic from 'next/dynamic';

// 关闭自动加载样式，改为手动引入，避免 Next.js 对 CSS 的特殊处理报错
import '@uiw/react-md-editor/markdown-editor.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <div style={{ padding: 24, color: '#999' }}>加载编辑器…</div>,
});

export default MDEditor;
