// config/api.js
// API 配置 - 自动根据环境切换域名

const { getConfig } = require('./env');

// 从环境配置获取 BASE_URL
const { BASE_URL } = getConfig();

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
