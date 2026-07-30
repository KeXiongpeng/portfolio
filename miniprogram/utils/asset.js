// utils/asset.js
const { BASE_URL } = require('../config/api');

/**
 * 将后端返回的相对资源路径(如 /uploads/xxx)补全为完整 URL。
 * 已是完整 URL(http(s):// 开头)则原样返回。
 * @param {string} [url]
 * @returns {string|undefined}
 */
function resolveAssetUrl(url) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

module.exports = { resolveAssetUrl };
