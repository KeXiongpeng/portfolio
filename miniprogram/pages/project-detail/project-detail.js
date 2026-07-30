// pages/project-detail/project-detail.js
const api = require('../../utils/api');
const { resolveAssetUrl } = require('../../utils/asset');
const towxml = require('../../towxml/index');

Page({
  data: {
    loading: true,
    project: null,
    coverUrl: '',
    contentNodes: null, // towxml 转换后的正文
  },

  onLoad(query) {
    this.slug = query.slug;
    this.fetchProject();
  },

  async fetchProject() {
    this.setData({ loading: true });
    try {
      const project = await api.getProject(this.slug);
      const contentNodes = project.content
        ? towxml(project.content, 'markdown', { theme: 'light' })
        : null;
      this.setData({
        project,
        coverUrl: resolveAssetUrl(project.cover_url),
        contentNodes,
        loading: false,
      });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onCopyLink(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.url });
  },
});
