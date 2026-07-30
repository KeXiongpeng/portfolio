// utils/fingerprint.js
const STORAGE_KEY = 'visit_fingerprint';

/**
 * 生成并持久化本机唯一访客指纹(对齐后端 visit/track 接口入参)。
 * 首次生成后写入 Storage,后续复用同一值。
 * @returns {string}
 */
function getFingerprint() {
  let fp = wx.getStorageSync(STORAGE_KEY);
  if (!fp) {
    fp = `mp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    wx.setStorageSync(STORAGE_KEY, fp);
  }
  return fp;
}

module.exports = { getFingerprint };
