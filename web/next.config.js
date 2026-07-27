// web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // 允许后端 /uploads 目录与 GitHub 头像
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3001' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '**' }, // 上线时收紧为你的 API 域名
    ],
  },
};
module.exports = nextConfig;
