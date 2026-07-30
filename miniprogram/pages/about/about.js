// pages/about/about.js
const api = require('../../utils/api');
const { resolveAssetUrl } = require('../../utils/asset');

Page({
  data: {
    loading: true,
    profile: null,
    avatarUrl: '',
  },

  onLoad() {
    this.fetchProfile();
  },

  async fetchProfile() {
    // 优先用 app 全局缓存,避免重复请求
    const app = getApp();
    if (app.globalData.profile) {
      this.applyProfile(app.globalData.profile);
      return;
    }
    this.setData({ loading: true });
    try {
      const profile = await api.getProfile();
      app.globalData.profile = profile;
      this.applyProfile(profile);
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  applyProfile(profile) {
    this.setData({
      profile,
      avatarUrl: resolveAssetUrl(profile.avatar_url),
      loading: false,
    });
  },

  onCopyLink(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.url });
  },

  goContact() {
    wx.navigateTo({ url: '/pages/contact/contact' });
  },
});
