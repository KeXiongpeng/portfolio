// utils/request.js
const { BASE_URL } = require('../config/api');

/**
 * Promise 化的 wx.request,统一拼 BASE_URL、解析 JSON、抛错。
 * @param {Object} options
 * @param {string} options.url       - 接口路径,以 / 开头(不含 BASE_URL)
 * @param {string} [options.method]  - 默认 GET
 * @param {Object} [options.data]    - 请求数据
 * @param {Object} [options.header]  - 自定义 header
 * @returns {Promise<any>} 成功 resolve 响应体 JSON,失败 reject Error
 */
function request(options) {
  const { url, method = 'GET', data, header } = options;
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: Object.assign({ 'Content-Type': 'application/json' }, header),
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 204 无内容
          if (res.statusCode === 204) return resolve(undefined);
          resolve(res.data);
        } else {
          const msg = (res.data && res.data.message) || `请求失败(${res.statusCode})`;
          reject(new Error(msg));
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求异常'));
      },
    });
  });
}

module.exports = { request };
