// web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // 强制使用相对路径，避免使用容器 hostname
  experimental: {
    // 确保所有路由都使用相对路径
    trustHostHeader: true,
  },
  images: {
    // 允许后端 /uploads 目录与 GitHub 头像
    remotePatterns: [
      { protocol: 'https', hostname: 'api.kxpwty.cn' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '**' },
      { protocol: 'https', hostname: 'api.kxp.o9k.cn' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
