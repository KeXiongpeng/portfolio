// pages/blogs/blogs.js
const api = require('../../utils/api');
const { formatDate } = require('../../utils/time');

Page({
  data: {
    loading: true,
    blogs: [],
    tags: [],
    activeTag: '',
    page: 1,
    limit: 10,
    totalPages: 1,
    loadingMore: false,
  },

  onLoad() {
    this.fetchBlogs(true);
  },

  onPullDownRefresh() {
    this.fetchBlogs(true).then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.page < this.data.totalPages && !this.data.loadingMore) {
      this.setData({ page: this.data.page + 1, loadingMore: true });
      this.fetchBlogs(false);
    }
  },

  async fetchBlogs(reset) {
    if (reset) {
      this.setData({ page: 1, loading: true });
    }
    try {
      const { page, limit, activeTag } = this.data;
      const res = await api.getBlogs(page, limit, activeTag || undefined);
      const items = (res.items || []).map((b) => ({
        ...b,
        published_at_label: formatDate(b.published_at),
      }));
      // 首次加载聚合标签
      if (reset) {
        const tagSet = new Set();
        items.forEach((b) => (b.tags || []).forEach((t) => tagSet.add(t)));
        this.setData({ tags: Array.from(tagSet).slice(0, 12) });
      }
      this.setData({
        blogs: reset ? items : this.data.blogs.concat(items),
        totalPages: res.totalPages || 1,
        loading: false,
        loadingMore: false,
      });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      this.setData({ loading: false, loadingMore: false });
    }
  },

  onTapTag(e) {
    this.setData({ activeTag: e.currentTarget.dataset.tag });
    this.fetchBlogs(true);
  },

  onClearTag() {
    this.setData({ activeTag: '' });
    this.fetchBlogs(true);
  },

  onTapBlog(e) {
    wx.navigateTo({ url: `/pages/blog-detail/blog-detail?slug=${e.currentTarget.dataset.slug}` });
  },
});
