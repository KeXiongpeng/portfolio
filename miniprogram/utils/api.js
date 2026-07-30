// utils/api.js
const { API_PATHS } = require('../config/api');
const { request } = require('./request');

function buildQuery(params) {
  const parts = [];
  Object.keys(params || {}).forEach((key) => {
    const val = params[key];
    if (val !== undefined && val !== null && val !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
    }
  });
  return parts.length ? `?${parts.join('&')}` : '';
}

const api = {
  // 个人信息
  getProfile() {
    return request({ url: API_PATHS.profile });
  },

  // 项目列表,tag 可选
  getProjects(tag) {
    const qs = buildQuery({ tag });
    return request({ url: `${API_PATHS.projects}${qs}` });
  },

  // 项目详情
  getProject(slug) {
    return request({ url: API_PATHS.projectDetail(slug) });
  },

  // 博客列表,支持分页与标签筛选
  getBlogs(page = 1, limit = 10, tag) {
    const qs = buildQuery({ page, limit, tag });
    return request({ url: `${API_PATHS.blogs}${qs}` });
  },

  // 博客详情(markdown content)
  getBlog(slug) {
    return request({ url: API_PATHS.blogDetail(slug) });
  },

  // 提交联系表单
  submitContact(data) {
    return request({
      url: API_PATHS.contact,
      method: 'POST',
      data,
    });
  },

  // 访客总数
  getVisitCount() {
    return request({ url: API_PATHS.visitCount });
  },

  // 上报访问
  trackVisit(fingerprint) {
    return request({
      url: API_PATHS.visitTrack,
      method: 'POST',
      data: { fingerprint },
    });
  },
};

module.exports = api;
