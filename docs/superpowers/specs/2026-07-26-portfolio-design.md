# 个人作品集与博客网站 — 需求设计文档

## 1. 项目概述

### 1.1 项目定位

一个全栈个人简历/作品集网站，前台展示个人信息、项目作品和博客文章，后台提供内容管理和访客统计功能。

### 1.2 设计风格

极简科技风，参考 Vercel / Linear 官网风格。深色/浅色主题切换，大量留白，平滑滚动动画，强调排版和动效。

### 1.3 部署方案

- 前端：Vercel 部署
- 后端（NestJS + PostgreSQL + Redis）：Docker 容器化部署到服务器

---

## 2. 技术栈

### 2.1 前端

| 技术 | 用途 |
|------|------|
| Next.js (App Router) | 前端框架，SSR/SSG |
| React | UI 组件 |
| TypeScript | 类型安全 |
| Tailwind CSS | 前台样式 + 响应式布局 |
| Ant Design | 管理后台 UI 组件库 |

### 2.2 后端

| 技术 | 用途 |
|------|------|
| Node.js / npm | 运行时 + 包管理 |
| NestJS | 后端 API 框架 |
| PostgreSQL | 数据持久化 |
| Redis | 缓存 + 访客计数 |
| Passport + JWT | OAuth2 GitHub 登录 + JWT 鉴权 |
| Docker | 容器化部署 |

### 2.3 基础设施

| 技术 | 用途 |
|------|------|
| Vercel | 前端生产部署 |
| Docker Compose | 后端服务编排 |
| GitHub Actions | CI/CD（可选） |

---

## 3. 仓库结构（Monorepo）

```
portfolio/
├── web/                    # Next.js 前端
│   ├── app/
│   │   ├── layout.tsx      # 根布局（主题、字体）
│   │   ├── page.tsx        # 首页
│   │   ├── about/
│   │   ├── projects/
│   │   │   ├── page.tsx           # 项目列表
│   │   │   └── [slug]/page.tsx    # 项目详情
│   │   ├── blog/
│   │   │   ├── page.tsx           # 博客列表
│   │   │   └── [slug]/page.tsx    # 博客详情
│   │   ├── contact/
│   │   │   └── page.tsx           # 联系我
│   │   ├── admin/                  # 管理后台
│   │   │   ├── login/page.tsx
│   │   │   ├── layout.tsx         # 后台布局（侧边栏+顶栏）
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── blogs/
│   │   │   │   ├── page.tsx               # 文章列表
│   │   │   │   └── [id]/edit/page.tsx     # 文章编辑
│   │   │   ├── projects/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── analytics/page.tsx
│   │   ├── sitemap.ts         # SEO sitemap 生成
│   │   └── robots.ts          # robots.txt 配置
│   ├── components/            # 共享组件
│   ├── lib/                   # 工具函数、API 客户端
│   └── public/                # 静态资源
├── server/                   # NestJS 后端
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # GitHub OAuth + JWT
│   │   │   ├── blog/          # 博客 CRUD
│   │   │   ├── project/       # 项目 CRUD
│   │   │   ├── contact/       # 联系表单
│   │   │   ├── visit/         # 访客统计
│   │   │   ├── profile/       # 个人信息管理
│   │   │   └── upload/        # 文件上传（项目封面图）
│   │   ├── common/
│   │   │   ├── guards/        # JWT 认证守卫
│   │   │   ├── decorators/    # 自定义装饰器
│   │   │   └── filters/       # 异常过滤器
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml         # 后端服务编排
├── .env.example              # 环境变量模板
├── .gitignore
└── README.md
```

---

## 4. 前台页面设计

### 4.1 首页 `/`

- **Hero 区域**：姓名、职位标题（如 Full-Stack Developer）、一句话个人介绍、社交链接（GitHub / LinkedIn / Email）、深色渐变背景或粒子效果
- **技能展示**：技术栈图标/标签网格，按前端/后端/工具分类
- **精选项目**：3-4 个代表性项目卡片（封面图 + 标题 + 技术标签），"查看全部"链接到 `/projects`
- **最新博客**：最近 3 篇博客文章卡片，"查看全部"链接到 `/blog`
- **页脚**：版权信息、社交链接、访客计数器

### 4.2 关于我 `/about`

- 个人详细介绍（头像 + 文字）
- 工作经历时间线（公司、职位、时间、描述）
- 教育背景

### 4.3 项目作品 `/projects`

- 项目卡片网格布局（封面图 + 标题 + 简介 + 技术栈标签）
- 顶部标签筛选栏（按技术栈过滤：React、Next.js、NestJS 等）
- 点击卡片进入项目详情

### 4.4 项目详情 `/projects/[slug]`

- 项目封面大图
- 项目名称、时间
- 技术栈标签
- 详细描述（支持 Markdown）
- 在线链接 / GitHub 链接按钮
- 返回列表

### 4.5 博客列表 `/blog`

- 文章卡片列表（标题、摘要、标签、发布日期、阅读量）
- 分页
- 标签筛选

### 4.6 博客详情 `/blog/[slug]`

- MDX 渲染的文章内容，代码高亮
- 右侧/左侧目录导航（TOC）
- 标签展示
- 发布日期
- 上一篇 / 下一篇文章导航

### 4.7 联系我 `/contact`

- 表单：姓名、邮箱、消息内容
- 提交后发送到后端 API，存入数据库
- 提交成功反馈

---

## 5. 管理后台设计

### 5.1 登录 `/admin/login`

- "使用 GitHub 登录" 按钮
- 点击后跳转 GitHub OAuth 授权页面
- 授权成功后回调，后端验证并签发 JWT，通过 HttpOnly Cookie 返回
- 只有白名单中的 GitHub ID 才能登录成功

### 5.2 后台布局 `/admin/*`

- 左侧固定侧边栏：仪表盘、博客管理、项目管理、个人信息、访客统计
- 顶部导航栏：用户头像、退出登录
- 使用 Ant Design 组件库

### 5.3 仪表盘 `/admin/dashboard`

- 统计卡片：总访问量、今日 PV、在线人数、博客数量、项目数量
- 最近 7 天 PV 折线图

### 5.4 博客管理 `/admin/blogs`

- Ant Design Table：标题、标签、状态（草稿/已发布）、创建时间、操作（编辑/删除/发布/下线）
- "新建文章" 按钮
- 支持搜索

### 5.5 博客编辑 `/admin/blogs/[id]/edit`

- 标题输入框
- 标签选择（可多选，支持新建标签）
- 摘要文本框
- MDX Markdown 编辑区域（分屏：左边编辑，右边实时预览）
- 保存草稿 / 发布按钮

### 5.6 项目管理 `/admin/projects`

- Ant Design Table：封面缩略图、标题、技术栈、排序、操作
- 新建 / 编辑表单（Modal 或独立页面）：标题、slug、描述、技术栈标签、在线链接、GitHub 链接、封面图上传
- 支持拖拽排序

### 5.7 个人信息 `/admin/profile`

- 编辑首页展示内容：姓名、职位、一句话介绍、详细介绍、头像 URL、社交链接（GitHub、LinkedIn、Email）
- 保存按钮

### 5.8 访客统计 `/admin/analytics`

- 总访问量、今日 PV、本周 PV、本月 PV、在线人数
- 最近 30 天 PV 折线图
- 数据来自 Redis 缓存 + PostgreSQL 持久化

---

## 6. 后端 API 设计

### 6.1 公开 API（无需鉴权）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/profile` | 获取个人信息 |
| GET | `/api/projects` | 获取项目列表（支持标签筛选） |
| GET | `/api/projects/:slug` | 获取单个项目详情 |
| GET | `/api/blogs` | 获取博客列表（分页、标签筛选） |
| GET | `/api/blogs/:slug` | 获取单篇博客详情 |
| POST | `/api/contact` | 提交联系表单 |
| GET | `/api/visit/count` | 获取公开访客计数 |
| POST | `/api/visit/track` | 记录一次访问（PV） |
| GET | `/api/auth/github` | 发起 GitHub OAuth 登录 |
| GET | `/api/auth/github/callback` | GitHub OAuth 回调 |

### 6.2 管理 API（需 JWT 鉴权）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/blogs` | 获取所有博客（含草稿） |
| POST | `/api/admin/blogs` | 创建博客 |
| PUT | `/api/admin/blogs/:id` | 更新博客 |
| DELETE | `/api/admin/blogs/:id` | 删除博客 |
| PATCH | `/api/admin/blogs/:id/publish` | 发布博客 |
| PATCH | `/api/admin/blogs/:id/unpublish` | 下线博客 |
| GET | `/api/admin/projects` | 获取所有项目 |
| POST | `/api/admin/projects` | 创建项目 |
| PUT | `/api/admin/projects/:id` | 更新项目 |
| DELETE | `/api/admin/projects/:id` | 删除项目 |
| PUT | `/api/admin/projects/reorder` | 批量更新排序 |
| GET | `/api/admin/profile` | 获取个人信息（完整） |
| PUT | `/api/admin/profile` | 更新个人信息 |
| POST | `/api/admin/upload` | 上传图片 |
| GET | `/api/admin/analytics` | 获取访客统计数据 |
| POST | `/api/admin/auth/refresh` | 刷新 JWT token |
| POST | `/api/admin/auth/logout` | 退出登录 |

---

## 7. 数据库设计（PostgreSQL）

### 7.1 users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL PRIMARY KEY | 主键 |
| github_id | INTEGER UNIQUE NOT NULL | GitHub 用户 ID |
| username | VARCHAR(100) NOT NULL | GitHub 用户名 |
| avatar_url | VARCHAR(500) | 头像 URL |
| role | VARCHAR(20) DEFAULT 'admin' | 角色 |
| created_at | TIMESTAMP DEFAULT NOW() | 创建时间 |

### 7.2 projects 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL PRIMARY KEY | 主键 |
| title | VARCHAR(200) NOT NULL | 项目名称 |
| slug | VARCHAR(200) UNIQUE NOT NULL | URL 友好标识 |
| description | TEXT | 简要描述 |
| content | TEXT | 详细描述（Markdown） |
| cover_url | VARCHAR(500) | 封面图 URL |
| tech_stack | TEXT[] | 技术栈标签数组 |
| demo_url | VARCHAR(500) | 在线链接 |
| github_url | VARCHAR(500) | GitHub 链接 |
| sort_order | INTEGER DEFAULT 0 | 排序权重 |
| is_visible | BOOLEAN DEFAULT true | 是否在前台展示 |
| created_at | TIMESTAMP DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP DEFAULT NOW() | 更新时间 |

### 7.3 blogs 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL PRIMARY KEY | 主键 |
| title | VARCHAR(200) NOT NULL | 文章标题 |
| slug | VARCHAR(200) UNIQUE NOT NULL | URL 友好标识 |
| content | TEXT NOT NULL | MDX 内容 |
| summary | VARCHAR(500) | 摘要 |
| tags | TEXT[] | 标签数组 |
| status | VARCHAR(20) DEFAULT 'draft' | draft / published |
| view_count | INTEGER DEFAULT 0 | 阅读量 |
| published_at | TIMESTAMP | 发布时间 |
| created_at | TIMESTAMP DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP DEFAULT NOW() | 更新时间 |

### 7.4 contacts 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL PRIMARY KEY | 主键 |
| name | VARCHAR(100) NOT NULL | 联系人姓名 |
| email | VARCHAR(200) NOT NULL | 邮箱 |
| message | TEXT NOT NULL | 消息内容 |
| is_read | BOOLEAN DEFAULT false | 是否已读 |
| created_at | TIMESTAMP DEFAULT NOW() | 创建时间 |

### 7.5 visit_stats 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL PRIMARY KEY | 主键 |
| date | DATE UNIQUE NOT NULL | 日期 |
| pv | INTEGER DEFAULT 0 | 页面浏览量 |
| uv | INTEGER DEFAULT 0 | 独立访客数 |
| created_at | TIMESTAMP DEFAULT NOW() | 创建时间 |

---

## 8. Redis 使用方案

### 8.1 访客计数

- Key: `visit:pv:today` — 今日 PV（STRING，INCR）
- Key: `visit:pv:total` — 总 PV（STRING，INCR）
- Key: `visit:uv:today` — 今日 UV（SET，存储访客 fingerprint）
- Key: `visit:online` — 在线人数（SET，存储 session ID，TTL 5 分钟）
- 定时任务（每分钟）：将 Redis 计数持久化到 PostgreSQL visit_stats 表

### 8.2 缓存

- Key: `cache:blog:list?page=1&tag=xxx` — 博客列表缓存（TTL 5 分钟）
- Key: `cache:profile` — 个人信息缓存（TTL 10 分钟）
- Key: `cache:project:list` — 项目列表缓存（TTL 10 分钟）
- 写操作时主动失效对应缓存

### 8.3 OAuth

- Key: `oauth:state:{random}` — GitHub OAuth state 参数（TTL 10 分钟），用于防止 CSRF

---

## 9. 认证与鉴权

### 9.1 GitHub OAuth2 流程

1. 用户点击"使用 GitHub 登录"
2. 前端跳转到 `/api/auth/github`（NestJS 后端）
3. 后端生成随机 state，存入 Redis，跳转 GitHub 授权页面
4. 用户授权后，GitHub 回调 `/api/auth/github/callback?code=xxx&state=xxx`
5. 后端验证 state（与 Redis 中的比对），用 code 换取 access_token
6. 用 access_token 获取 GitHub 用户信息
7. 检查 github_id 是否在白名单（环境变量 `ALLOWED_GITHUB_IDS`）
8. 签发 JWT，通过 HttpOnly + Secure + SameSite Cookie 返回前端
9. 前端重定向到 `/admin/dashboard`

### 9.2 JWT 鉴权

- JWT Payload: `{ sub: userId, githubId, username, role, iat, exp }`
- 有效期：7 天
- 存储方式：HttpOnly Cookie（前端 JavaScript 无法读取，防 XSS）
- 前端请求时浏览器自动携带 Cookie
- NestJS JWT Guard 校验 token 有效性
- 提供 refresh token 接口用于续期

---

## 10. SEO 策略

### 10.1 Meta 标签

每个页面通过 Next.js `metadata` 导出配置：
- `title`：页面标题（格式：`页面名 | 个人名`）
- `description`：页面描述
- `openGraph`：OG 标题、描述、图片（用于社交媒体分享）
- 首页额外配置 `alternates.canonical`

### 10.2 Sitemap

通过 `app/sitemap.ts` 动态生成，包含：
- 所有公开页面（首页、关于、项目列表、博客列表、联系）
- 所有已发布的项目详情页
- 所有已发布的博客详情页

### 10.3 Robots.txt

通过 `app/robots.ts` 配置：
- User-agent: *
- Allow: /
- Disallow: /admin/
- Disallow: /api/
- Sitemap: https://yourdomain.com/sitemap.xml

### 10.4 性能

- 使用 Next.js `Image` 组件自动优化图片（WebP、懒加载、尺寸适配）
- Server Components 默认，减少客户端 JavaScript
- 动态导入非关键组件

---

## 11. 响应式布局断点

使用 Tailwind CSS 默认断点：

| 断点 | 宽度 | 适配设备 |
|------|------|----------|
| 默认 | < 640px | 手机 |
| sm | >= 640px | 大屏手机 |
| md | >= 768px | 平板 |
| lg | >= 1024px | 笔记本 |
| xl | >= 1280px | 桌面显示器 |

管理后台仅适配 md 以上（平板和桌面），不针对手机优化。

---

## 12. Docker 部署

### 12.1 docker-compose.yml 服务

| 服务 | 镜像/构建 | 端口 | 说明 |
|------|-----------|------|------|
| server | ./server (Dockerfile) | 3001 | NestJS 后端 |
| postgres | postgres:16-alpine | 5432 | 数据库 |
| redis | redis:7-alpine | 6379 | 缓存 |

### 12.2 环境变量（.env）

```env
# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=portfolio
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=https://your-api-domain.com/api/auth/github/callback
ALLOWED_GITHUB_IDS=your_github_id

# Upload
UPLOAD_DIR=/uploads
MAX_FILE_SIZE=5242880
```

---

## 13. 技术栈覆盖验证

| 学习的技术 | 项目中的使用 |
|------------|-------------|
| Node.js | NestJS 运行时 |
| npm | 前后端包管理 |
| Next.js App Router | 所有页面路由 |
| SEO (sitemap) | `app/sitemap.ts` 动态生成 |
| Geo（生成式引擎优化 GEO） | 结构化数据（JSON-LD / schema.org）、`llms.txt`、语义化 HTML，让 ChatGPT/Perplexity 等 AI 搜索引擎更容易提取、理解和引用网站内容 |
| robots.txt | `app/robots.ts` 配置 |
| React | 所有 UI 组件 |
| Vercel | 前端生产部署 |
| Tailwind CSS | 前台样式 + 响应式布局 |
| 响应式布局 | 所有页面移动端适配 |
| Docker | 后端 + PostgreSQL + Redis 容器化 |
| Redis | 访客计数 + 数据缓存 + OAuth state |
| PostgreSQL | 业务数据持久化 |
| OAuth2 | GitHub 第三方登录 |
| JWT 鉴权 | 登录后 token 签发与验证 |
| NestJS | 后端 RESTful API 框架 |
| Ant Design | 管理后台 UI |