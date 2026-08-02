// config/api.js
// 生产环境 HTTPS 域名（需在微信小程序后台配置「request 合法域名」）
const BASE_URL = 'http://120.77.222.102:3001';

// 所有公开接口路径
const API_PATHS = {
  profile: '/api/profile',
  projects: '/api/projects',
  projectDetail: (slug) => `/api/projects/${slug}`,
  blogs: '/api/blogs',
  blogDetail: (slug) => `/api/blogs/${slug}`,
  contact: '/api/contact',
  visitCount: '/api/visit/count',
  visitTrack: '/api/visit/track',
};

module.exports = { BASE_URL, API_PATHS };
