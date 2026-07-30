// pages/projects/projects.js
const api = require('../../utils/api');
const { resolveAssetUrl } = require('../../utils/asset');

Page({
  data: {
    loading: true,
    projects: [],
    tags: [],
    activeTag: '',
  },

  onLoad() {
    this.fetchProjects();
  },

  onPullDownRefresh() {
    this.fetchProjects().then(() => wx.stopPullDownRefresh());
  },

  async fetchProjects() {
    this.setData({ loading: true });
    try {
      const list = await api.getProjects(this.data.activeTag || undefined);
      // 补全封面路径(后端可能返回 /uploads/xxx 相对路径)
      const projects = (list || []).map((p) => ({
        ...p,
        cover_url: resolveAssetUrl(p.cover_url),
      }));
      // 首次加载时聚合所有技术栈作为筛选标签
      if (!this.data.activeTag) {
        const tagSet = new Set();
        projects.forEach((p) => (p.tech_stack || []).forEach((t) => tagSet.add(t)));
        this.setData({ tags: Array.from(tagSet).slice(0, 12) });
      }
      this.setData({ projects, loading: false });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onTapTag(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({ activeTag: tag });
    this.fetchProjects();
  },

  onClearTag() {
    this.setData({ activeTag: '' });
    this.fetchProjects();
  },

  onTapProject(e) {
    wx.navigateTo({ url: `/pages/project-detail/project-detail?slug=${e.currentTarget.dataset.slug}` });
  },
});
