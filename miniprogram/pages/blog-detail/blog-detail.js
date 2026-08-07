// pages/blog-detail/blog-detail.js
const api = require('../../utils/api');
const { formatDate } = require('../../utils/time');
const { resolveAssetUrl } = require('../../utils/asset');
const towxml = require('../../towxml/index');

Page({
  data: {
    loading: true,
    blog: null,
    article: null, // towxml 转换后的数据
  },

  onLoad(query) {
    this.slug = query.slug;
    this.fetchBlog();
  },

  async fetchBlog() {
    this.setData({ loading: true });
    try {
      const blog = await api.getBlog(this.slug);
      blog.published_at_label = formatDate(blog.published_at);
      blog.cover_url = resolveAssetUrl(blog.cover_url);
      // markdown 转 towxml 结构
      const article = blog.content
        ? towxml(blog.content, 'markdown', { theme: 'light' })
        : null;
      this.setData({ blog, article, loading: false });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },
});
