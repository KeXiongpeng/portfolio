# 微信小程序前端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为现有 NestJS 后端构建一套微信小程序原生(WXML/WXSS/JS)前端,完美适配后端所有公开接口,覆盖首页/关于/项目/博客/联系 5 大模块。

**Architecture:** 小程序作为纯 C 端内容浏览入口,与 web/、server/ 平级新增 `miniprogram/` 目录。统一封装 `wx.request` 网络层,图片相对路径自动补全后端域名。不改动后端任何代码,仅消费 8 个公开 RESTful 接口。博客 markdown 内容用 `towxml` 库渲染。

**Tech Stack:** 微信小程序原生(App/API/组件)、JavaScript(ES2015+)、WXSS、towxml(markdown 渲染)、Promise 化 wx.request。

## Global Constraints

- **平台**:微信小程序原生开发,不使用 Taro/uni-app 等跨端框架
- **语言**:JavaScript(非 TypeScript),符合你师父推荐的「基础架构」
- **后端不变**:严禁修改 `server/` 下任何文件;仅消费以下 8 个公开接口:
  - `GET /api/profile`、`GET /api/projects`、`GET /api/projects/:slug`
  - `GET /api/blogs`、`GET /api/blogs/:slug`
  - `POST /api/contact`、`GET /api/visit/count`、`POST /api/visit/track`
- **后端基地址**:开发环境 `http://localhost:3001`,生产环境配置在 `config/api.js` 的 `BASE_URL`
- **字段对齐**:严格使用后端实体字段名(`avatar_url`、`tech_stack`、`cover_url`、`published_at` 等 snake_case)
- **无登录**:小程序端不做用户鉴权,所有请求均走公开接口,不带 token
- **图片路径**:后端返回的相对路径(如 `/uploads/xxx`)必须经 `resolveAssetUrl` 拼成完整 URL
- **目录位置**:所有文件位于 `c:\Users\sun\Desktop\学习产出\miniprogram\` 下
- **开发调试**:微信开发者工具勾选「不校验合法域名、HTTPS 证书」,以便用 localhost 后端

---

## 文件结构总览

```
miniprogram/
├── app.js                      # 全局入口:全局数据、启动上报访问
├── app.json                    # 全局配置:页面路由、tabBar、窗口样式
├── app.wxss                    # 全局样式:设计 token、通用类
├── project.config.json         # 开发者工具项目配置
├── sitemap.json                # 小程序索引配置
├── config/
│   └── api.js                  # 接口地址常量与 BASE_URL
├── utils/
│   ├── request.js              # Promise 化 wx.request 封装
│   ├── api.js                  # 业务 API(8 个接口的命名方法)
│   ├── asset.js                # resolveAssetUrl 图片路径补全
│   ├── fingerprint.js          # 本机访客指纹生成
│   └── time.js                 # 时间格式化(YYYY-MM-DD 等)
├── components/
│   ├── empty/                  # 空状态占位组件
│   ├── tag-pill/               # 技术栈/标签胶囊组件
│   └── loading/                # 加载骨架组件
└── pages/
    ├── index/                  # 首页(tabBar)
    ├── projects/               # 项目列表(tabBar)
    ├── blogs/                  # 博客列表(tabBar)
    ├── about/                  # 关于我(tabBar)
    ├── project-detail/         # 项目详情(普通页)
    ├── blog-detail/            # 博客详情(普通页,towxml 渲染)
    └── contact/                # 联系我(普通页)
```

**底部 TabBar**(4 个):首页、项目、博客、关于。联系入口放在「关于」页和首页底部。

---

## Task 1: 项目骨架与全局配置

**Files:**
- Create: `miniprogram/project.config.json`
- Create: `miniprogram/sitemap.json`
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.wxss`
- Create: `miniprogram/app.js`

**Interfaces:**
- Produces: `app` 全局实例,供各页面通过 `getApp()` 读取全局数据

- [ ] **Step 1: 创建项目配置 `project.config.json`**

```json
{
  "miniprogramRoot": "./",
  "projectname": "portfolio-miniprogram",
  "description": "个人作品集小程序",
  "appid": "touristappid",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true,
    "newFeature": true
  },
  "compileType": "miniprogram",
  "libVersion": "3.0.0"
}
```

- [ ] **Step 2: 创建索引配置 `sitemap.json`**

```json
{
  "desc": "关于本文件的更多信息,请参考文档 https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/sitemap.html",
  "rules": [{
    "action": "allow",
    "page": "*"
  }]
}
```

- [ ] **Step 3: 创建全局配置 `app.json`**

```json
{
  "pages": [
    "pages/index/index",
    "pages/projects/projects",
    "pages/blogs/blogs",
    "pages/about/about",
    "pages/project-detail/project-detail",
    "pages/blog-detail/blog-detail",
    "pages/contact/contact"
  ],
  "window": {
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "个人作品集",
    "backgroundColor": "#f7f7f9",
    "backgroundTextStyle": "dark",
    "enablePullDownRefresh": false
  },
  "tabBar": {
    "color": "#9ca3af",
    "selectedColor": "#3b82f6",
    "backgroundColor": "#ffffff",
    "borderStyle": "white",
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/projects/projects", "text": "项目" },
      { "pagePath": "pages/blogs/blogs", "text": "博客" },
      { "pagePath": "pages/about/about", "text": "关于" }
    ]
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

> 说明:tabBar 图标先留空(显示纯文字)。如需图标,后续在 `tabBar.list` 每项补 `iconPath`/`selectedIconPath`,图标文件放 `assets/tabbar/`。

- [ ] **Step 4: 创建全局样式 `app.wxss`**

```css
/* 设计 token */
page {
  --color-primary: #3b82f6;
  --color-primary-light: #dbeafe;
  --color-text: #18181b;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #9ca3af;
  --color-bg: #f7f7f9;
  --color-card: #ffffff;
  --color-border: #e5e7eb;
  --radius-sm: 8rpx;
  --radius-md: 16rpx;
  --radius-lg: 24rpx;
  --shadow-card: 0 2rpx 12rpx rgba(0,0,0,0.05);
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 28rpx;
  line-height: 1.6;
}

/* 通用容器 */
.container {
  padding: 32rpx;
}

/* 卡片 */
.card {
  background-color: var(--color-card);
  border-radius: var(--radius-lg);
  padding: 32rpx;
  box-shadow: var(--shadow-card);
  margin-bottom: 24rpx;
}

/* 标题 */
.title-xl { font-size: 56rpx; font-weight: 700; }
.title-lg { font-size: 40rpx; font-weight: 600; }
.title-md { font-size: 32rpx; font-weight: 600; }

/* 文本辅助 */
.text-secondary { color: var(--color-text-secondary); }
.text-tertiary { color: var(--color-text-tertiary); }
.text-primary { color: var(--color-primary); }

/* 行截断(2 行) */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* 章节标题 */
.section-title {
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title .more {
  font-size: 26rpx;
  font-weight: 400;
  color: var(--color-text-tertiary);
}
```

- [ ] **Step 5: 创建全局入口 `app.js`**

```javascript
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
```

- [ ] **Step 6: 手动验证**

在微信开发者工具导入 `miniprogram/` 目录,编译运行。
预期:无报错,首页(占位)可打开,tabBar 显示 4 个标签。

- [ ] **Step 7: 提交**

```bash
git add miniprogram/project.config.json miniprogram/sitemap.json miniprogram/app.json miniprogram/app.wxss miniprogram/app.js
git commit -m "feat(miniprogram): 搭建项目骨架与全局配置"
```

---

## Task 2: 网络层与业务 API 封装

**Files:**
- Create: `miniprogram/config/api.js`
- Create: `miniprogram/utils/request.js`
- Create: `miniprogram/utils/api.js`
- Create: `miniprogram/utils/asset.js`
- Create: `miniprogram/utils/fingerprint.js`
- Create: `miniprogram/utils/time.js`

**Interfaces:**
- Produces:
  - `request(options): Promise<any>` —— 统一请求,自动拼 BASE_URL、解析 JSON、抛错
  - `api.getProfile()` → `Promise<Profile>`
  - `api.getProjects(tag?)` → `Promise<Project[]>`
  - `api.getProject(slug)` → `Promise<Project>`
  - `api.getBlogs(page, limit, tag?)` → `Promise<{items,total,page,totalPages}>`
  - `api.getBlog(slug)` → `Promise<Blog>`
  - `api.submitContact({name,email,message})` → `Promise<void>`
  - `api.getVisitCount()` → `Promise<{total}>`
  - `api.trackVisit(fingerprint)` → `Promise<void>`
  - `resolveAssetUrl(url?)` → `string|undefined`
  - `getFingerprint()` → `string`
  - `formatDate(iso)` → `string` (YYYY-MM-DD)

- [ ] **Step 1: 创建接口配置 `config/api.js`**

```javascript
// config/api.js
// 开发环境用本地后端;上线前改为生产 HTTPS 域名,并在小程序后台配置「request 合法域名」
const BASE_URL = 'http://localhost:3001';

// 所有公开接口路径
const API_PATHS = {
  profile: '/api/profile',
  projects: '/api/projects',
  projectDetail: (slug) => `/api/projects/${slug}`,
  blogs: '/api/blogs',
  blogDetail: (slug) => `/api/blogs/${slug}`,
  contact: '/api/contact',
  visitCount: '/api/visit/count',
  visitTrack: '/api/visit/track',
};

module.exports = { BASE_URL, API_PATHS };
```

- [ ] **Step 2: 创建请求封装 `utils/request.js`**

```javascript
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
```

- [ ] **Step 3: 创建业务 API `utils/api.js`**

```javascript
// utils/api.js
const { API_PATHS } = require('../config/api');
const { request } = require('./request');

function buildQuery(params) {
  const parts = [];
  Object.keys(params || {}).forEach((key) => {
    const val = params[key];
    if (val !== undefined && val !== null && val !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
    }
  });
  return parts.length ? `?${parts.join('&')}` : '';
}

const api = {
  // 个人信息
  getProfile() {
    return request({ url: API_PATHS.profile });
  },

  // 项目列表,tag 可选
  getProjects(tag) {
    const qs = buildQuery({ tag });
    return request({ url: `${API_PATHS.projects}${qs}` });
  },

  // 项目详情
  getProject(slug) {
    return request({ url: API_PATHS.projectDetail(slug) });
  },

  // 博客列表,支持分页与标签筛选
  getBlogs(page = 1, limit = 10, tag) {
    const qs = buildQuery({ page, limit, tag });
    return request({ url: `${API_PATHS.blogs}${qs}` });
  },

  // 博客详情(markdown content)
  getBlog(slug) {
    return request({ url: API_PATHS.blogDetail(slug) });
  },

  // 提交联系表单
  submitContact(data) {
    return request({
      url: API_PATHS.contact,
      method: 'POST',
      data,
    });
  },

  // 访客总数
  getVisitCount() {
    return request({ url: API_PATHS.visitCount });
  },

  // 上报访问
  trackVisit(fingerprint) {
    return request({
      url: API_PATHS.visitTrack,
      method: 'POST',
      data: { fingerprint },
    });
  },
};

module.exports = api;
```

- [ ] **Step 4: 创建图片路径补全 `utils/asset.js`**

```javascript
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
```

- [ ] **Step 5: 创建访客指纹生成 `utils/fingerprint.js`**

```javascript
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
```

- [ ] **Step 6: 创建时间格式化 `utils/time.js`**

```javascript
// utils/time.js

/**
 * 将 ISO 时间字符串格式化为 YYYY-MM-DD。
 * @param {string} iso
 * @returns {string}
 */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

module.exports = { formatDate };
```

- [ ] **Step 7: 手动验证**

在开发者工具控制台执行:
```javascript
const api = require('./utils/api');
api.getVisitCount().then(console.log).catch(console.error);
```
预期:打印 `{total: 数字}`(需后端已启动)。若后端未启动则打印网络错误。

- [ ] **Step 8: 提交**

```bash
git add miniprogram/config miniprogram/utils
git commit -m "feat(miniprogram): 封装网络层与业务 API"
```

---

## Task 3: 公共组件(空状态 / 标签胶囊 / 加载)

**Files:**
- Create: `miniprogram/components/empty/*` (js/json/wxml/wxss)
- Create: `miniprogram/components/tag-pill/*`
- Create: `miniprogram/components/loading/*`

**Interfaces:**
- `empty` 属性:`text`(string,默认"暂无数据")
- `tag-pill` 属性:`text`(string)
- `loading` 属性:`text`(string,默认"加载中...")

- [ ] **Step 1: 创建 empty 组件**

`components/empty/empty.json`:
```json
{ "component": true }
```

`components/empty/empty.js`:
```javascript
Component({
  properties: {
    text: { type: String, value: '暂无数据' },
  },
});
```

`components/empty/empty.wxml`:
```xml
<view class="empty">
  <view class="empty-icon">📭</view>
  <text class="empty-text">{{text}}</text>
</view>
```

`components/empty/empty.wxss`:
```css
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}
.empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { color: var(--color-text-tertiary); font-size: 28rpx; }
```

- [ ] **Step 2: 创建 tag-pill 组件**

`components/tag-pill/tag-pill.json`:
```json
{ "component": true }
```

`components/tag-pill/tag-pill.js`:
```javascript
Component({
  properties: {
    text: { type: String, value: '' },
  },
});
```

`components/tag-pill/tag-pill.wxml`:
```xml
<view class="pill">{{text}}</view>
```

`components/tag-pill/tag-pill.wxss`:
```css
.pill {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 100rpx;
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 22rpx;
  margin-right: 12rpx;
  margin-bottom: 8rpx;
}
```

- [ ] **Step 3: 创建 loading 组件**

`components/loading/loading.json`:
```json
{ "component": true }
```

`components/loading/loading.js`:
```javascript
Component({
  properties: {
    text: { type: String, value: '加载中...' },
  },
});
```

`components/loading/loading.wxml`:
```xml
<view class="loading">
  <view class="loading-spinner"></view>
  <text class="loading-text">{{text}}</text>
</view>
```

`components/loading/loading.wxss`:
```css
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}
.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16rpx;
}
.loading-text { color: var(--color-text-tertiary); font-size: 26rpx; }
@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 4: 手动验证**

在任一测试页 json 引入 `"usingComponents": { "empty": "/components/empty/empty" }`,wxml 写 `<empty />`,编译查看渲染。

- [ ] **Step 5: 提交**

```bash
git add miniprogram/components
git commit -m "feat(miniprogram): 新增 empty/tag-pill/loading 公共组件"
```

---

## Task 4: 首页页(pages/index)

**对应后端接口:**
- `GET /api/profile` → Hero 区(姓名/职位/简介/头像/社交链接)
- `GET /api/projects` → 精选项目(取前 3 个)
- `GET /api/blogs?page=1&limit=3` → 最新博客(取 items)
- `GET /api/visit/count` → 访客计数
- `POST /api/visit/track` → 上报访问(onLoad 时)

**Files:**
- Create: `miniprogram/pages/index/index.{js,json,wxml,wxss}`

**字段对齐(Profile):**
- `name`、`title`、`bio`、`avatar_url`(需 resolveAssetUrl)
- `social_links`:`{github, linkedin, email, twitter}`
- `skills`:`[{name, category}]`

- [ ] **Step 1: 创建 `pages/index/index.json`**

```json
{
  "navigationBarTitleText": "首页",
  "usingComponents": {
    "loading": "/components/loading/loading",
    "empty": "/components/empty/empty",
    "tag-pill": "/components/tag-pill/tag-pill"
  }
}
```

- [ ] **Step 2: 创建 `pages/index/index.js`**

```javascript
// pages/index/index.js
const api = require('../../utils/api');
const { resolveAssetUrl } = require('../../utils/asset');
const { getFingerprint } = require('../../utils/fingerprint');

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

  async fetchAll() {
    this.setData({ loading: true });
    try {
      const [profile, projects, blogList, visit] = await Promise.all([
        api.getProfile().catch(() => null),
        api.getProjects().catch(() => []),
        api.getBlogs(1, 3).catch(() => ({ items: [] })),
        api.getVisitCount().catch(() => ({ total: 0 })),
      ]);

      const skills = (profile && profile.skills) || [];
      const categories = Array.from(new Set(skills.map((s) => s.category)));
      const groupedSkills = categories.map((cat) => ({
        category: cat,
        items: skills.filter((s) => s.category === cat),
      }));

      this.setData({
        profile,
        projects: (projects || []).slice(0, 3),
        blogs: ((blogList && blogList.items) || []),
        visitTotal: visit.total || 0,
        skillCategories: groupedSkills,
        avatarUrl: resolveAssetUrl(profile && profile.avatar_url),
        loading: false,
      });
    } catch (e) {
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

  // 跳转联系页
  goContact() {
    wx.navigateTo({ url: '/pages/contact/contact' });
  },
});
```

- [ ] **Step 3: 创建 `pages/index/index.wxml`**

```xml
<view class="container">
  <loading wx:if="{{loading}}" />

  <block wx:else>
    <!-- Hero -->
    <view class="hero">
      <image wx:if="{{avatarUrl}}" class="hero-avatar" src="{{avatarUrl}}" mode="aspectFill" />
      <view class="hero-name">{{profile.name || 'Your Name'}}</view>
      <view class="hero-title">{{profile.title || 'Full-Stack Developer'}}</view>
      <view wx:if="{{profile.bio}}" class="hero-bio">{{profile.bio}}</view>

      <!-- 社交链接 -->
      <view class="social-row">
        <view wx:if="{{profile.social_links.github}}" class="social-btn" bindtap="onCopyLink" data-url="{{profile.social_links.github}}">GitHub</view>
        <view wx:if="{{profile.social_links.linkedin}}" class="social-btn" bindtap="onCopyLink" data-url="{{profile.social_links.linkedin}}">LinkedIn</view>
        <view wx:if="{{profile.social_links.email}}" class="social-btn" bindtap="onCopyLink" data-url="{{profile.social_links.email}}">Email</view>
      </view>

      <!-- 访客计数 -->
      <view class="visit-badge">👁 {{visitTotal}} 次访问</view>
    </view>

    <!-- 技能 -->
    <view wx:if="{{skillCategories.length}}" class="section">
      <view class="section-title">技能</view>
      <view class="card" wx:for="{{skillCategories}}" wx:key="category">
        <view class="skill-cat-title">{{item.category}}</view>
        <view class="skill-tags">
          <tag-pill wx:for="{{item.items}}" wx:for-item="s" wx:key="name" text="{{s.name}}" />
        </view>
      </view>
    </view>

    <!-- 精选项目 -->
    <view wx:if="{{projects.length}}" class="section">
      <view class="section-title">
        <text>精选项目</text>
        <text class="more" bindtap="onTapTab" data-path="/pages/projects/projects">查看全部 →</text>
      </view>
      <view class="project-card card" wx:for="{{projects}}" wx:key="id" bindtap="onTapProject" data-slug="{{item.slug}}">
        <image wx:if="{{item.cover_url}}" class="project-cover" src="{{item.cover_url}}" mode="aspectFill" />
        <view class="project-title">{{item.title}}</view>
        <view class="project-desc line-clamp-2">{{item.description}}</view>
        <view class="project-stack">
          <tag-pill wx:for="{{item.tech_stack}}" wx:for-item="t" wx:for-index="ti" wx:if="{{ti < 3}}" wx:key="*this" text="{{t}}" />
        </view>
      </view>
    </view>

    <!-- 最新博客 -->
    <view wx:if="{{blogs.length}}" class="section">
      <view class="section-title">
        <text>最新博客</text>
        <text class="more" bindtap="onTapTab" data-path="/pages/blogs/blogs">查看全部 →</text>
      </view>
      <view class="blog-card card" wx:for="{{blogs}}" wx:key="id" bindtap="onTapBlog" data-slug="{{item.slug}}">
        <view class="blog-date">{{item.published_at}}</view>
        <view class="blog-title">{{item.title}}</view>
        <view class="blog-summary line-clamp-2">{{item.summary}}</view>
      </view>
    </view>

    <!-- 联系入口 -->
    <view class="contact-cta card" bindtap="goContact">
      <view class="cta-title">想要合作?</view>
      <view class="cta-sub">点此给我留言 →</view>
    </view>

    <empty wx:if="{{!profile && !projects.length && !blogs.length}}" text="暂无内容" />
  </block>
</view>
```

> 注:`onTapTab` 用于 tabBar 切换,见 Step 4。

- [ ] **Step 4: 补充 `onTapTab` 方法到 index.js**

在 `goContact` 方法后追加:

```javascript
  // 跳转 tabBar 页(首页的项目/博客「查看全部」)
  onTapTab(e) {
    wx.switchTab({ url: e.currentTarget.dataset.path });
  },
```

- [ ] **Step 5: 创建 `pages/index/index.wxss`**

```css
.hero {
  text-align: center;
  padding: 60rpx 0 40rpx;
}
.hero-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 6rpx solid #fff;
  box-shadow: var(--shadow-card);
  margin: 0 auto 24rpx;
  display: block;
}
.hero-name { font-size: 52rpx; font-weight: 700; }
.hero-title { font-size: 30rpx; color: var(--color-text-secondary); margin-top: 12rpx; }
.hero-bio {
  font-size: 26rpx;
  color: var(--color-text-tertiary);
  margin-top: 16rpx;
  padding: 0 40rpx;
  line-height: 1.7;
}
.social-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 32rpx;
}
.social-btn {
  padding: 12rpx 28rpx;
  border: 1rpx solid var(--color-border);
  border-radius: 100rpx;
  font-size: 24rpx;
  color: var(--color-text-secondary);
}
.visit-badge {
  margin-top: 32rpx;
  display: inline-block;
  padding: 8rpx 24rpx;
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 100rpx;
  font-size: 24rpx;
}

.section { margin-top: 56rpx; }
.skill-cat-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.skill-tags { display: flex; flex-wrap: wrap; }

.project-card { padding: 0; overflow: hidden; }
.project-cover { width: 100%; height: 240rpx; }
.project-card .project-title,
.project-card .project-desc,
.project-card .project-stack { padding: 0 24rpx; }
.project-title { font-size: 30rpx; font-weight: 600; margin-top: 20rpx; }
.project-desc {
  font-size: 24rpx;
  color: var(--color-text-secondary);
  margin-top: 8rpx;
}
.project-stack { margin-top: 16rpx; padding-bottom: 24rpx; display: flex; flex-wrap: wrap; }

.blog-card .blog-date { font-size: 22rpx; color: var(--color-text-tertiary); }
.blog-card .blog-title { font-size: 30rpx; font-weight: 600; margin-top: 8rpx; }
.blog-card .blog-summary {
  font-size: 24rpx;
  color: var(--color-text-secondary);
  margin-top: 8rpx;
}

.contact-cta {
  margin-top: 56rpx;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
  text-align: center;
}
.contact-cta .cta-title { font-size: 32rpx; font-weight: 600; }
.contact-cta .cta-sub { font-size: 26rpx; opacity: 0.9; margin-top: 8rpx; }
```

- [ ] **Step 6: 手动验证**

后端启动后,编译首页。
预期:头像、姓名、职位、技能分类、3 个项目、3 篇博客、访问计数均正常显示。控制台无字段 undefined 报错。

- [ ] **Step 7: 提交**

```bash
git add miniprogram/pages/index
git commit -m "feat(miniprogram): 完成首页(Hero/技能/精选项目/最新博客/访客计数)"
```

---

## Task 5: 项目列表与详情页

**对应后端接口:**
- `GET /api/projects?tag=` → 列表(支持标签筛选)
- `GET /api/projects/:slug` → 详情(`content` 为 markdown)

**Files:**
- Create: `miniprogram/pages/projects/projects.{js,json,wxml,wxss}`
- Create: `miniprogram/pages/project-detail/project-detail.{js,json,wxml,wxss}`

**字段对齐(Project):**
- `title`、`slug`、`description`、`content`(markdown)、`cover_url`
- `tech_stack`[]、`demo_url`、`github_url`

- [ ] **Step 1: 创建 `pages/projects/projects.json`**

```json
{
  "navigationBarTitleText": "项目作品",
  "enablePullDownRefresh": true,
  "usingComponents": {
    "loading": "/components/loading/loading",
    "empty": "/components/empty/empty",
    "tag-pill": "/components/tag-pill/tag-pill"
  }
}
```

- [ ] **Step 2: 创建 `pages/projects/projects.js`**

```javascript
// pages/projects/projects.js
const api = require('../../utils/api');

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
      const projects = list || [];
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
```

- [ ] **Step 3: 创建 `pages/projects/projects.wxml`**

```xml
<view class="container">
  <!-- 标签筛选 -->
  <scroll-view scroll-x class="tag-bar" wx:if="{{tags.length}}">
    <view class="tag-item {{activeTag === '' ? 'active' : ''}}" bindtap="onClearTag">全部</view>
    <view class="tag-item {{activeTag === item ? 'active' : ''}}" wx:for="{{tags}}" wx:key="*this" bindtap="onTapTag" data-tag="{{item}}">{{item}}</view>
  </scroll-view>

  <loading wx:if="{{loading}}" />
  <block wx:else>
    <empty wx:if="{{!projects.length}}" text="暂无项目" />
    <view class="project-card card" wx:for="{{projects}}" wx:key="id" bindtap="onTapProject" data-slug="{{item.slug}}">
      <image wx:if="{{item.cover_url}}" class="cover" src="{{item.cover_url}}" mode="aspectFill" />
      <view class="body">
        <view class="title">{{item.title}}</view>
        <view class="desc line-clamp-2">{{item.description}}</view>
        <view class="stack">
          <tag-pill wx:for="{{item.tech_stack}}" wx:for-item="t" wx:for-index="ti" wx:if="{{ti < 4}}" wx:key="*this" text="{{t}}" />
        </view>
      </view>
    </view>
  </block>
</view>
```

- [ ] **Step 4: 创建 `pages/projects/projects.wxss`**

```css
.tag-bar {
  white-space: nowrap;
  padding: 16rpx 0 24rpx;
}
.tag-item {
  display: inline-block;
  padding: 10rpx 28rpx;
  margin-right: 16rpx;
  border-radius: 100rpx;
  background-color: var(--color-card);
  border: 1rpx solid var(--color-border);
  font-size: 24rpx;
  color: var(--color-text-secondary);
}
.tag-item.active {
  background-color: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.project-card { padding: 0; overflow: hidden; }
.project-card .cover { width: 100%; height: 280rpx; }
.project-card .body { padding: 24rpx; }
.project-card .title { font-size: 30rpx; font-weight: 600; }
.project-card .desc { font-size: 24rpx; color: var(--color-text-secondary); margin-top: 8rpx; }
.project-card .stack { margin-top: 16rpx; display: flex; flex-wrap: wrap; }
```

- [ ] **Step 5: 创建 `pages/project-detail/project-detail.json`**

```json
{
  "navigationBarTitleText": "项目详情",
  "usingComponents": {
    "loading": "/components/loading/loading",
    "tag-pill": "/components/tag-pill/tag-pill"
  }
}
```

- [ ] **Step 6: 创建 `pages/project-detail/project-detail.js`**

```javascript
// pages/project-detail/project-detail.js
const api = require('../../utils/api');

Page({
  data: {
    loading: true,
    project: null,
  },

  onLoad(query) {
    this.slug = query.slug;
    this.fetchProject();
  },

  async fetchProject() {
    this.setData({ loading: true });
    try {
      const project = await api.getProject(this.slug);
      this.setData({ project, loading: false });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onCopyLink(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.url });
  },
});
```

- [ ] **Step 7: 创建 `pages/project-detail/project-detail.wxml`**

```xml
<loading wx:if="{{loading}}" />
<block wx:elif="{{project}}">
  <image wx:if="{{project.cover_url}}" class="hero-cover" src="{{project.cover_url}}" mode="aspectFill" />

  <view class="container">
    <view class="title">{{project.title}}</view>
    <view class="stack">
      <tag-pill wx:for="{{project.tech_stack}}" wx:key="*this" text="{{item}}" />
    </view>

    <view wx:if="{{project.description}}" class="desc card">
      <view class="block-title">简介</view>
      <view class="block-text">{{project.description}}</view>
    </view>

    <!-- content 是 markdown,此处先用纯文本兜底;Task 8 接入 towxml 后替换为富文本 -->
    <view wx:if="{{project.content}}" class="content card">
      <view class="block-title">详细介绍</view>
      <view class="block-text">{{project.content}}</view>
    </view>

    <view class="links">
      <view wx:if="{{project.demo_url}}" class="link-btn primary" bindtap="onCopyLink" data-url="{{project.demo_url}}">复制 Demo 链接</view>
      <view wx:if="{{project.github_url}}" class="link-btn" bindtap="onCopyLink" data-url="{{project.github_url}}">复制 GitHub 链接</view>
    </view>
  </view>
</block>
```

- [ ] **Step 8: 创建 `pages/project-detail/project-detail.wxss`**

```css
.hero-cover { width: 100%; height: 400rpx; }
.title { font-size: 40rpx; font-weight: 700; margin-bottom: 16rpx; }
.stack { display: flex; flex-wrap: wrap; margin-bottom: 24rpx; }
.block-title { font-size: 28rpx; font-weight: 600; margin-bottom: 12rpx; }
.block-text { font-size: 26rpx; color: var(--color-text-secondary); line-height: 1.8; white-space: pre-wrap; }
.links { display: flex; gap: 16rpx; margin-top: 32rpx; }
.link-btn {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  border-radius: var(--radius-md);
  border: 1rpx solid var(--color-border);
  font-size: 26rpx;
}
.link-btn.primary {
  background-color: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
```

- [ ] **Step 9: 手动验证**

从首页或项目列表点进详情。预期:标题、技术栈、简介、链接按钮正常;控制台无报错。

- [ ] **Step 10: 提交**

```bash
git add miniprogram/pages/projects miniprogram/pages/project-detail
git commit -m "feat(miniprogram): 完成项目列表与详情页"
```

---

## Task 6: 博客列表与详情页

**对应后端接口:**
- `GET /api/blogs?page=&limit=&tag=` → 列表分页(返回 `{items,total,page,totalPages}`)
- `GET /api/blogs/:slug` → 详情(`content` 为 markdown)

**Files:**
- Create: `miniprogram/pages/blogs/blogs.{js,json,wxml,wxss}`
- Create: `miniprogram/pages/blog-detail/blog-detail.{js,json,wxml,wxss}`

**字段对齐(Blog):**
- `title`、`slug`、`summary`、`tags`[]、`status`、`view_count`、`published_at`、`content`

- [ ] **Step 1: 创建 `pages/blogs/blogs.json`**

```json
{
  "navigationBarTitleText": "博客",
  "enablePullDownRefresh": true,
  "usingComponents": {
    "loading": "/components/loading/loading",
    "empty": "/components/empty/empty",
    "tag-pill": "/components/tag-pill/tag-pill"
  }
}
```

- [ ] **Step 2: 创建 `pages/blogs/blogs.js`**

```javascript
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
```

- [ ] **Step 3: 创建 `pages/blogs/blogs.wxml`**

```xml
<view class="container">
  <scroll-view scroll-x class="tag-bar" wx:if="{{tags.length}}">
    <view class="tag-item {{activeTag === '' ? 'active' : ''}}" bindtap="onClearTag">全部</view>
    <view class="tag-item {{activeTag === item ? 'active' : ''}}" wx:for="{{tags}}" wx:key="*this" bindtap="onTapTag" data-tag="{{item}}">{{item}}</view>
  </scroll-view>

  <loading wx:if="{{loading}}" />
  <block wx:else>
    <empty wx:if="{{!blogs.length}}" text="暂无文章" />
    <view class="blog-card card" wx:for="{{blogs}}" wx:key="id" bindtap="onTapBlog" data-slug="{{item.slug}}">
      <view class="date">{{item.published_at_label}}</view>
      <view class="title">{{item.title}}</view>
      <view class="summary line-clamp-2">{{item.summary}}</view>
      <view class="tags">
        <tag-pill wx:for="{{item.tags}}" wx:for-item="t" wx:key="*this" text="{{t}}" />
      </view>
    </view>
    <loading wx:if="{{loadingMore}}" text="加载更多..." />
  </block>
</view>
```

- [ ] **Step 4: 创建 `pages/blogs/blogs.wxss`**

```css
.tag-bar { white-space: nowrap; padding: 16rpx 0 24rpx; }
.tag-item {
  display: inline-block;
  padding: 10rpx 28rpx;
  margin-right: 16rpx;
  border-radius: 100rpx;
  background-color: var(--color-card);
  border: 1rpx solid var(--color-border);
  font-size: 24rpx;
  color: var(--color-text-secondary);
}
.tag-item.active { background-color: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.blog-card .date { font-size: 22rpx; color: var(--color-text-tertiary); }
.blog-card .title { font-size: 30rpx; font-weight: 600; margin-top: 8rpx; }
.blog-card .summary { font-size: 24rpx; color: var(--color-text-secondary); margin-top: 8rpx; }
.blog-card .tags { margin-top: 16rpx; display: flex; flex-wrap: wrap; }
```

- [ ] **Step 5: 创建 `pages/blog-detail/blog-detail.json`**

```json
{
  "navigationBarTitleText": "文章详情",
  "usingComponents": {
    "loading": "/components/loading/loading",
    "tag-pill": "/components/tag-pill/tag-pill",
    "towxml": "/towxml/towxml"
  }
}
```

> 注:`towxml` 在 Task 8 引入;此处先声明,未引入前编译会报组件不存在,Task 8 完成后即可正常。

- [ ] **Step 6: 创建 `pages/blog-detail/blog-detail.js`**

```javascript
// pages/blog-detail/blog-detail.js
const api = require('../../utils/api');
const { formatDate } = require('../../utils/time');
const towxml = require('../../towxml/index'); // Task 8 引入

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
```

- [ ] **Step 7: 创建 `pages/blog-detail/blog-detail.wxml`**

```xml
<loading wx:if="{{loading}}" />
<block wx:elif="{{blog}}">
  <view class="container">
    <view class="title">{{blog.title}}</view>
    <view class="meta">
      <text>{{blog.published_at_label}}</text>
      <text class="dot">·</text>
      <text>阅读 {{blog.view_count}}</text>
    </view>
    <view class="tags">
      <tag-pill wx:for="{{blog.tags}}" wx:key="*this" text="{{item}}" />
    </view>

    <view wx:if="{{blog.summary}}" class="summary">{{blog.summary}}</view>

    <!-- towxml 渲染 markdown 正文 -->
    <view wx:if="{{article}}">
      <towxml nodes="{{article}}" />
    </view>
    <view wx:elif="{{blog.content}}" class="fallback-text">{{blog.content}}</view>
  </view>
</block>
```

- [ ] **Step 8: 创建 `pages/blog-detail/blog-detail.wxss`**

```css
.title { font-size: 44rpx; font-weight: 700; line-height: 1.4; }
.meta { font-size: 24rpx; color: var(--color-text-tertiary); margin-top: 12rpx; }
.dot { margin: 0 12rpx; }
.tags { margin-top: 16rpx; display: flex; flex-wrap: wrap; }
.summary {
  margin-top: 24rpx;
  padding: 24rpx;
  background-color: var(--color-primary-light);
  border-radius: var(--radius-md);
  font-size: 26rpx;
  color: var(--color-text);
}
.fallback-text {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: var(--color-text-secondary);
  line-height: 1.8;
  white-space: pre-wrap;
}
```

- [ ] **Step 9: 手动验证**

进入博客列表 → 点进详情。预期:列表分页下滑加载、详情标题/阅读数/摘要正常;正文在 Task 8 引入 towxml 前会显示兜底纯文本。

- [ ] **Step 10: 提交**

```bash
git add miniprogram/pages/blogs miniprogram/pages/blog-detail
git commit -m "feat(miniprogram): 完成博客列表(分页)与详情页"
```

---

## Task 7: 关于我页与联系页

**对应后端接口:**
- `GET /api/profile` → 关于我(`about`、`experience`、`education`、`skills`)
- `POST /api/contact` → 联系表单(`{name, email, message}`)

**Files:**
- Create: `miniprogram/pages/about/about.{js,json,wxml,wxss}`
- Create: `miniprogram/pages/contact/contact.{js,json,wxml,wxss}`

**字段对齐(Profile):**
- `about`、`experience`:`[{company, role, period, description}]`
- `education`:`[{school, degree, period, description}]`
- `social_links`、`skills`

- [ ] **Step 1: 创建 `pages/about/about.json`**

```json
{
  "navigationBarTitleText": "关于我",
  "usingComponents": {
    "loading": "/components/loading/loading",
    "tag-pill": "/components/tag-pill/tag-pill"
  }
}
```

- [ ] **Step 2: 创建 `pages/about/about.js`**

```javascript
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
```

- [ ] **Step 3: 创建 `pages/about/about.wxml`**

```xml
<loading wx:if="{{loading}}" />
<block wx:elif="{{profile}}">
  <view class="container">
    <!-- 头像与基本信息 -->
    <view class="header">
      <image wx:if="{{avatarUrl}}" class="avatar" src="{{avatarUrl}}" mode="aspectFill" />
      <view class="name">{{profile.name}}</view>
      <view class="title-text">{{profile.title}}</view>
    </view>

    <!-- 简介 -->
    <view wx:if="{{profile.about}}" class="card">
      <view class="block-title">关于</view>
      <view class="block-text">{{profile.about}}</view>
    </view>

    <!-- 工作经历 -->
    <view wx:if="{{profile.experience.length}}" class="card">
      <view class="block-title">工作经历</view>
      <view class="timeline">
        <view class="timeline-item" wx:for="{{profile.experience}}" wx:key="company">
          <view class="timeline-dot"></view>
          <view class="timeline-content">
            <view class="timeline-role">{{item.role}} · {{item.company}}</view>
            <view class="timeline-period">{{item.period}}</view>
            <view class="timeline-desc">{{item.description}}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 教育背景 -->
    <view wx:if="{{profile.education.length}}" class="card">
      <view class="block-title">教育背景</view>
      <view class="timeline">
        <view class="timeline-item" wx:for="{{profile.education}}" wx:key="school">
          <view class="timeline-dot"></view>
          <view class="timeline-content">
            <view class="timeline-role">{{item.degree}} · {{item.school}}</view>
            <view class="timeline-period">{{item.period}}</view>
            <view class="timeline-desc">{{item.description}}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 社交 -->
    <view class="card">
      <view class="block-title">联系方式</view>
      <view class="links">
        <view wx:if="{{profile.social_links.github}}" class="link-item" bindtap="onCopyLink" data-url="{{profile.social_links.github}}">GitHub</view>
        <view wx:if="{{profile.social_links.linkedin}}" class="link-item" bindtap="onCopyLink" data-url="{{profile.social_links.linkedin}}">LinkedIn</view>
        <view wx:if="{{profile.social_links.email}}" class="link-item" bindtap="onCopyLink" data-url="{{profile.social_links.email}}">Email</view>
      </view>
    </view>

    <button class="contact-btn" bindtap="goContact">给我留言</button>
  </view>
</block>
```

- [ ] **Step 4: 创建 `pages/about/about.wxss`**

```css
.header { text-align: center; padding: 40rpx 0; }
.avatar { width: 160rpx; height: 160rpx; border-radius: 50%; }
.name { font-size: 44rpx; font-weight: 700; margin-top: 16rpx; }
.title-text { font-size: 28rpx; color: var(--color-text-secondary); margin-top: 8rpx; }
.block-title { font-size: 30rpx; font-weight: 600; margin-bottom: 16rpx; }
.block-text { font-size: 26rpx; color: var(--color-text-secondary); line-height: 1.8; }
.timeline { position: relative; padding-left: 32rpx; }
.timeline::before {
  content: '';
  position: absolute;
  left: 8rpx;
  top: 8rpx;
  bottom: 8rpx;
  width: 2rpx;
  background-color: var(--color-border);
}
.timeline-item { position: relative; padding-bottom: 32rpx; }
.timeline-dot {
  position: absolute;
  left: -32rpx;
  top: 8rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: var(--color-primary);
}
.timeline-role { font-size: 28rpx; font-weight: 600; }
.timeline-period { font-size: 22rpx; color: var(--color-text-tertiary); margin-top: 4rpx; }
.timeline-desc { font-size: 24rpx; color: var(--color-text-secondary); margin-top: 8rpx; }
.links { display: flex; flex-wrap: wrap; gap: 16rpx; }
.link-item {
  padding: 12rpx 28rpx;
  border: 1rpx solid var(--color-border);
  border-radius: 100rpx;
  font-size: 24rpx;
  color: var(--color-text-secondary);
}
.contact-btn {
  margin-top: 40rpx;
  background-color: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 30rpx;
}
```

- [ ] **Step 5: 创建 `pages/contact/contact.json`**

```json
{
  "navigationBarTitleText": "联系我"
}
```

- [ ] **Step 6: 创建 `pages/contact/contact.js`**

```javascript
// pages/contact/contact.js
const api = require('../../utils/api');

Page({
  data: {
    form: { name: '', email: '', message: '' },
    submitting: false,
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async onSubmit() {
    const { name, email, message } = this.data.form;
    // 基础校验(与后端 DTO 对齐:IsString name, IsEmail email, IsString message)
    if (!name.trim()) return wx.showToast({ title: '请输入姓名', icon: 'none' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return wx.showToast({ title: '邮箱格式不正确', icon: 'none' });
    if (!message.trim()) return wx.showToast({ title: '请输入留言内容', icon: 'none' });

    this.setData({ submitting: true });
    try {
      await api.submitContact({ name: name.trim(), email: email.trim(), message: message.trim() });
      wx.showToast({ title: '提交成功', icon: 'success' });
      this.setData({ form: { name: '', email: '', message: '' } });
    } catch (e) {
      wx.showToast({ title: e.message || '提交失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
```

- [ ] **Step 7: 创建 `pages/contact/contact.wxml`**

```xml
<view class="container">
  <view class="card">
    <view class="block-title">给我留言</view>
    <view class="form-item">
      <text class="label">姓名</text>
      <input class="input" placeholder="请输入您的姓名" value="{{form.name}}" bindinput="onInput" data-field="name" />
    </view>
    <view class="form-item">
      <text class="label">邮箱</text>
      <input class="input" type="text" placeholder="请输入邮箱" value="{{form.email}}" bindinput="onInput" data-field="email" />
    </view>
    <view class="form-item">
      <text class="label">留言</text>
      <textarea class="textarea" placeholder="请输入留言内容" value="{{form.message}}" bindinput="onInput" data-field="message" maxlength="500" />
    </view>
    <button class="submit-btn" bindtap="onSubmit" loading="{{submitting}}" disabled="{{submitting}}">提交</button>
  </view>
</view>
```

- [ ] **Step 8: 创建 `pages/contact/contact.wxss`**

```css
.block-title { font-size: 32rpx; font-weight: 600; margin-bottom: 24rpx; }
.form-item { margin-bottom: 28rpx; }
.label { display: block; font-size: 26rpx; color: var(--color-text-secondary); margin-bottom: 12rpx; }
.input {
  width: 100%;
  padding: 20rpx 24rpx;
  border: 1rpx solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 28rpx;
  background-color: #fff;
  box-sizing: border-box;
}
.textarea {
  width: 100%;
  height: 200rpx;
  padding: 20rpx 24rpx;
  border: 1rpx solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 28rpx;
  background-color: #fff;
  box-sizing: border-box;
}
.submit-btn {
  margin-top: 16rpx;
  background-color: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 30rpx;
}
.submit-btn[disabled] { opacity: 0.6; }
```

- [ ] **Step 9: 手动验证**

1. 关于页:头像、简介、经历时间线、教育背景、社交链接复制正常。
2. 联系页:留空提交 → 弹 toast;邮箱格式错误 → 弹 toast;正常提交 → 后端 `contacts` 表新增一条记录(可查数据库验证)。

- [ ] **Step 10: 提交**

```bash
git add miniprogram/pages/about miniprogram/pages/contact
git commit -m "feat(miniprogram): 完成关于我页与联系表单页"
```

---

## Task 8: 引入 towxml 渲染博客 Markdown 正文

**对应后端接口:** `GET /api/blogs/:slug` 返回的 `content` 为 markdown 字符串。

**Files:**
- Create: `miniprogram/towxml/*` (从官方仓库拷贝)
- Modify: `miniprogram/pages/blog-detail/blog-detail.js` (已在 Task 6 预埋引入)
- Modify: `miniprogram/pages/project-detail/project-detail.js` (项目 content 也改用 towxml)

**说明:** towxml 是腾讯开源的小程序 markdown/html 富文本组件,支持代码高亮、表格、列表等,与后端 markdown 字段天然契合。

- [ ] **Step 1: 下载 towxml 到 `miniprogram/towxml/`**

在微信开发者工具终端,或在仓库根目录执行(Windows PowerShell):
```powershell
cd c:\Users\sun\Desktop\学习产出\miniprogram
# 方式一:直接 git clone 后取目录
git clone https://github.com/sbfkcel/towxml.git _towxml_tmp
# 将 _towxml_tmp/ 下的 towxml 目录(注意是内层)移动到 miniprogram/towxml
Move-Item _towxml_tmp\towxml .\towxml -Force
Remove-Item -Recurse -Force _towxml_tmp
```

验证:`miniprogram/towxml/index.js`、`miniprogram/towxml/towxml.wxml`、`miniprogram/towxml/towxml.json`、`miniprogram/towxml/towxml.wxss` 均存在。

- [ ] **Step 2: 确认 blog-detail 已正确引入**

检查 `pages/blog-detail/blog-detail.js` 顶部已有(Task 6 已写):
```javascript
const towxml = require('../../towxml/index');
```
及 `blog-detail.json` 的 `usingComponents` 已声明 `"towxml": "/towxml/towxml"`。

- [ ] **Step 3: 修改 project-detail 接入 towxml**

`pages/project-detail/project-detail.js` 顶部新增引入,并在 `fetchProject` 中转换 `content`:

```javascript
// pages/project-detail/project-detail.js
const api = require('../../utils/api');
const towxml = require('../../towxml/index');

Page({
  data: {
    loading: true,
    project: null,
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
      this.setData({ project, contentNodes, loading: false });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onCopyLink(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.url });
  },
});
```

- [ ] **Step 4: 修改 project-detail.json 与 wxml**

`project-detail.json` 的 `usingComponents` 增加:
```json
{ "towxml": "/towxml/towxml" }
```

`project-detail.wxml` 中替换原 `content` 纯文本块为:
```xml
<!-- content 用 towxml 渲染 -->
<view wx:if="{{contentNodes}}" class="content card">
  <view class="block-title">详细介绍</view>
  <towxml nodes="{{contentNodes}}" />
</view>
```

- [ ] **Step 5: 手动验证**

进入任一博客详情。预期:markdown 的标题、代码块、列表、加粗等正常渲染(不再是纯文本)。进入项目详情同理。

- [ ] **Step 6: 提交**

```bash
git add miniprogram/towxml miniprogram/pages/blog-detail miniprogram/pages/project-detail
git commit -m "feat(miniprogram): 引入 towxml 渲染 markdown 正文"
```

---

## Task 9: 全局走查与发布前检查清单

**Files:**
- 检查:全部 `miniprogram/` 文件

**说明:** 上线前必须完成的合规与体验检查项。

- [ ] **Step 1: 接口联通性自查**

逐一确认小程序能正确调用并渲染以下接口的返回:
- [ ] `GET /api/profile` —— 首页 Hero、关于我页
- [ ] `GET /api/projects` —— 首页精选、项目列表
- [ ] `GET /api/projects/:slug` —— 项目详情
- [ ] `GET /api/blogs` —— 首页最新、博客列表(含分页、标签筛选)
- [ ] `GET /api/blogs/:slug` —— 博客详情(markdown)
- [ ] `POST /api/contact` —— 联系表单(校验数据库新增)
- [ ] `GET /api/visit/count` —— 首页访客数
- [ ] `POST /api/visit/track` —— 首页 onLoad 触发(校验 Redis `visit:pv:total` 递增)

- [ ] **Step 2: 字段对齐自查**

核对各页面用到的字段名与后端实体一致(snake_case):
- [ ] `profile.avatar_url`、`profile.social_links.{github,linkedin,email,twitter}`
- [ ] `profile.skills[].{name,category}`
- [ ] `profile.experience[].{company,role,period,description}`
- [ ] `profile.education[].{school,degree,period,description}`
- [ ] `project.cover_url`、`project.tech_stack`、`project.demo_url`、`project.github_url`、`project.content`
- [ ] `blog.summary`、`blog.tags`、`blog.view_count`、`blog.published_at`、`blog.content`
- [ ] `BlogListResponse`:`{items, total, page, totalPages}`

- [ ] **Step 3: 资源路径自查**

确认所有用到后端图片/头像的位置都经过 `resolveAssetUrl()`:
- [ ] `pages/index` 头像
- [ ] `pages/about` 头像
- [ ] `pages/projects`、`pages/index` 的项目封面(`cover_url` 若是相对路径需补全;若是完整 URL 则原样返回)

> 注:项目 `cover_url` 当前在 wxml 直接绑定。若后端返回相对路径,需在 js 中预处理。修订见 Step 4。

- [ ] **Step 4: 修订项目封面路径处理**

在 `pages/projects/projects.js` 的 `fetchProjects` 中,对每个项目的 `cover_url` 补全:
```javascript
const { resolveAssetUrl } = require('../../utils/asset');
// fetchProjects 内 setData 前:
const projects = (list || []).map((p) => ({
  ...p,
  cover_url: resolveAssetUrl(p.cover_url),
}));
```

同样修改 `pages/index/index.js` 的 `fetchAll`(精选项目封面)与 `pages/project-detail/project-detail.js` 的 `fetchProject`(详情大图)。

- [ ] **Step 5: 发布前小程序后台配置**

1. 登录 mp.weixin.qq.com → 开发管理 → 开发设置 → 服务器域名 → request 合法域名,添加生产后端 HTTPS 域名(如 `https://api.yourdomain.com`)。
2. 修改 `config/api.js` 的 `BASE_URL` 为生产域名。
3. 关闭开发者工具「不校验合法域名」选项,用真机预览验证。

- [ ] **Step 6: 体验自查**

- [ ] 首页下拉刷新正常
- [ ] 博客列表触底分页正常
- [ ] 标签筛选切换正常
- [ ] 联系表单空值/格式校验生效
- [ ] 无控制台报错与未处理 Promise rejection

- [ ] **Step 7: 最终提交**

```bash
git add miniprogram
git commit -m "chore(miniprogram): 资源路径补全与发布前走查"
```

---

## 自查记录(Spec Coverage)

| 后端公开接口 | 实现位置 | 状态 |
|---|---|---|
| `GET /api/profile` | Task 1(app 预载)、Task 4(首页)、Task 7(关于我) | ✅ |
| `GET /api/projects` | Task 4(首页精选)、Task 5(列表+筛选) | ✅ |
| `GET /api/projects/:slug` | Task 5(详情) | ✅ |
| `GET /api/blogs` | Task 4(首页最新)、Task 6(列表分页) | ✅ |
| `GET /api/blogs/:slug` | Task 6(详情 markdown) | ✅ |
| `POST /api/contact` | Task 7(联系表单) | ✅ |
| `GET /api/visit/count` | Task 4(首页访客数) | ✅ |
| `POST /api/visit/track` | Task 4(首页 onLoad) | ✅ |

**后端改动:零。** 全部通过消费现有 8 个公开接口完成。
