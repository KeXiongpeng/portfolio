// app.js
App({
  globalData: {
    profile: null,        // 缓存个人信息,避免每个页面重复请求
    visitTracked: false,  // 避免重复上报访问
  },

  onLaunch() {
    // 启动时预拉取个人信息并缓存
    this.loadProfile();
  },

  async loadProfile() {
    try {
      const { getProfile } = require('./utils/api');
      const profile = await getProfile();
      this.globalData.profile = profile;
    } catch (e) {
      // 忽略:页面层有各自的兜底渲染
      console.warn('[app] profile 预加载失败', e);
    }
  },
});
