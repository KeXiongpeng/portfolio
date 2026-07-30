// pages/index/index.js
const api = require('../../utils/api');
const { resolveAssetUrl } = require('../../utils/asset');
const { getFingerprint } = require('../../utils/fingerprint');
const { formatDate } = require('../../utils/time');

Page({
  data: {
    loading: true,
    profile: null,
    projects: [],
    blogs: [],
    visitTotal: 0,
    skillCategories: [],
    avatarUrl: '',
  },

  onLoad() {
    // 先用全局缓存做即时渲染(避免白屏等待)
    const app = getApp();
    if (app.globalData.profile) {
      this.applyProfile(app.globalData.profile);
    }
    this.trackVisit();
    this.fetchAll();
  },

  onPullDownRefresh() {
    this.fetchAll().then(() => wx.stopPullDownRefresh());
  },

  // 上报访问(对齐 POST /api/visit/track)
  trackVisit() {
    api.trackVisit(getFingerprint()).catch(() => {});
  },

  // 用 profile 数据填充 UI(首页 hero 区)
  applyProfile(profile) {
    if (!profile) return;
    const skills = profile.skills || [];
    const categories = Array.from(new Set(skills.map((s) => s.category)));
    const groupedSkills = categories.map((cat) => ({
      category: cat,
      items: skills.filter((s) => s.category === cat),
    }));
    this.setData({
      profile,
      skillCategories: groupedSkills,
      avatarUrl: resolveAssetUrl(profile.avatar_url),
    });
  },

  async fetchAll() {
    this.setData({ loading: true });
    try {
      const [profile, projects, blogList, visit] = await Promise.all([
        api.getProfile().catch((e) => {
          console.warn('[index] getProfile failed:', e.message);
          return null;
        }),
        api.getProjects().catch((e) => {
          console.warn('[index] getProjects failed:', e.message);
          return [];
        }),
        api.getBlogs(1, 3).catch((e) => {
          console.warn('[index] getBlogs failed:', e.message);
          return { items: [] };
        }),
        api.getVisitCount().catch((e) => {
          console.warn('[index] getVisitCount failed:', e.message);
          return { total: 0 };
        }),
      ]);

      // 缓存到全局,供 about 等页面复用
      if (profile) {
        const app = getApp();
        app.globalData.profile = profile;
      }

      // 项目封面补全为完整 URL(后端可能返回 /uploads/xxx 相对路径)
      const resolvedProjects = (projects || []).slice(0, 3).map((p) => ({
        ...p,
        cover_url: resolveAssetUrl(p.cover_url),
      }));

      // 博客日期格式化
      const resolvedBlogs = ((blogList && blogList.items) || []).map((b) => ({
        ...b,
        published_at_label: formatDate(b.published_at),
      }));

      // 更新 profile 区(如果本次拿到了新数据)
      if (profile) {
        this.applyProfile(profile);
      }

      this.setData({
        projects: resolvedProjects,
        blogs: resolvedBlogs,
        visitTotal: visit.total || 0,
        loading: false,
      });

      console.log('[index] data loaded:', {
        hasProfile: !!profile,
        projectName: (projects || []).length,
        blogCount: resolvedBlogs.length,
        visitTotal: visit.total,
      });
    } catch (e) {
      console.error('[index] fetchAll error:', e);
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 跳转项目详情
  onTapProject(e) {
    wx.navigateTo({ url: `/pages/project-detail/project-detail?slug=${e.currentTarget.dataset.slug}` });
  },

  // 跳转博客详情
  onTapBlog(e) {
    wx.navigateTo({ url: `/pages/blog-detail/blog-detail?slug=${e.currentTarget.dataset.slug}` });
  },

  // 复制社交链接(小程序内 a 标签行为受限,改为复制)
  onCopyLink(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.url });
  },

  // 跳转 tabBar 页(首页的项目/博客「查看全部」)
  onTapTab(e) {
    wx.switchTab({ url: e.currentTarget.dataset.path });
  },

  // 跳转联系页
  goContact() {
    wx.navigateTo({ url: '/pages/contact/contact' });
  },
});
