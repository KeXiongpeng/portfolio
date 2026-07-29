# Portfolio Vercel 部署指南

> 本项目为全栈 Monorepo：`web/`（Next.js 前端）+ `server/`（NestJS 后端），依赖 PostgreSQL + Redis。
> Vercel 原生支持 Next.js，但 NestJS 需改造为 Serverless Functions 才能运行。

---

## 架构总览

```
GitHub 仓库
  ├── web/      → Vercel 项目 A（Next.js 前端，原生支持）
  └── server/   → Vercel 项目 B（NestJS 后端，需改造为 Serverless）
                   ├── PostgreSQL → Neon（Vercel Marketplace 免费托管 PG）
                   ├── Redis      → Upstash（Serverless 兼容 Redis）
                   ├── 文件上传   → Vercel Blob（Serverless 无本地磁盘）
                   └── 定时任务   → Vercel Cron（替代 @nestjs/schedule）
```

---

## 前置准备：账号注册

| 平台 | 用途 | 注册地址 | 费用 |
|------|------|----------|------|
| Vercel | 部署前后端 | https://vercel.com/signup（用 GitHub 登录） | 免费层足够 |
| Neon | 托管 PostgreSQL | https://neon.tech（用 GitHub 登录） | 免费层 0.5GB |
| Upstash | 托管 Redis | https://upstash.com（用 GitHub 登录） | 免费层 10000 请求/天 |

---

## 第一部分：外部服务配置

### 1.1 创建 Neon PostgreSQL 数据库

1. 打开 https://console.neon.tech → Login with GitHub
2. 点击 **New Project**
   - Name: `portfolio`
   - Region: 选离你最近的（如 `Singapore`）
   - Postgres Version: 默认 16
   - Role: `portfolio_user`
3. 创建完成后，在 Dashboard 找到 **Connection String**，格式如下：
   ```
   postgresql://portfolio_user:xxxxxxxx@ep-xxx.sg1-0.aws.neon.tech/portfolio?sslmode=require
   postgresql://neondb_owner:npg_kJyEHORA01Pv@ep-cool-field-ayq3wp96.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   > 记下这个连接串，后面要用。

### 1.2 创建 Upstash Redis

1. 打开 https://console.upstash.com → Login with GitHub
2. 点击 **Create Database**
   - Name: `portfolio-redis`  
   - Region: 与 Neon 一致（如 `Singapore (AWS ap-southeast-1)`）
   - TLS: 开启
3. 创建完成后，找到以下两个信息：
   - **Endpoint**: `xxx.upstash.io`，**Port**: `6379`   // /cute-burro-74368.upstash.io
   - **REST URL**: `https://xxx.upstash.io`（Serverless 模式用这个更稳）// "https://cute-burro-74368.upstash.io"
   - **Token / Password**: `xxxxxxxx` // "gQAAAAAAASKAAAIgcDI1MzU1MTU2NGEzMDQ0ZWE0OTljNmI4NzE4ZWRkNjU0Zg"
   > 记下这些，后面要用。

> **为什么必须用 Upstash？** 你项目用的 `ioredis` 在 Serverless 冷启动时会频繁建连，可能导致连接泄漏。Upstash 支持 REST API 模式，通过 HTTP 调用 Redis，完美兼容 Serverless。

---

## 第二部分：后端（NestJS）部署

### 2.1 安装 Serverless 适配依赖

在 `server/` 目录执行：

```powershell
cd server
npm install @codegenie/serverless-express
```

### 2.2 创建 Serverless 入口文件

在 `server/` 根目录创建 `api/index.ts`：

```typescript
// server/api/index.ts
// 将 NestJS 应用包装为 Vercel Serverless Function
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import { AppModule } from '../src/app.module';
import * as cookieParser from 'cookie-parser';

let cachedServer: ReturnType<typeof serverlessExpress>;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  app.use(cookieParser());

  // CORS 在此处配置（替代 main.ts）
  const corsOrigin = process.env.FRONTEND_URL || '*';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  return cachedServer(req, res);
}
```

### 2.3 修改文件上传（diskStorage → Vercel Blob）

Serverless 没有持久磁盘，`multer` 的 `diskStorage` 无法使用。需改用 Vercel Blob。

**步骤 a：安装 Vercel Blob SDK**

```powershell
cd server
npm install @vercel/blob
```

**步骤 b：重写上传控制器**

将 `server/src/modules/upload/upload.controller.ts` 替换为：

```typescript
import { Controller, Post, UseGuards, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { put } from '@vercel/blob';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10);

@UseGuards(JwtAuthGuard)
@Controller('api/admin/upload')
@UseInterceptors(FileInterceptor('file', {
  storage: memoryStorage(), // 改用内存存储，上传到 Vercel Blob
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype)) {
      return cb(new BadRequestException('Only image files are allowed'), false);
    }
    cb(null, true);
  },
}))
export class UploadController {
  @Post()
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // 上传到 Vercel Blob
    const blob = await put(
      `uploads/${Date.now()}-${file.originalname}`,
      file.buffer,
      { access: 'public', contentType: file.mimetype }
    );
    // 返回完整 URL（Vercel Blob 提供永久 CDN 地址）
    return { url: blob.url };
  }
}
```

> **注意**：Vercel Blob 返回的是完整 CDN URL（如 `https://xxx.public.blob.vercel-storage.com/...`），不再是相对路径。前台 `resolveAssetUrl` 函数对完整 URL 会原样返回，无需改动。

### 2.4 处理定时任务（Cron）

项目中 `visit.cron.ts` 使用了定时任务统计访问量。Serverless 模式下长驻定时器不可用，改用 Vercel Cron。

**步骤 a：创建 Cron 接口**

在 `server/api/cron.ts` 创建：

```typescript
// server/api/cron.ts
// Vercel Cron 调用的接口，执行访问统计
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import { AppModule } from '../src/app.module';
import { VisitService } from '../src/modules/visit/visit.service';

export default async function handler(req: any, res: any) {
  // 仅允许 Vercel Cron 调用（通过 Authorization 头校验）
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const visitService = app.get(VisitService);
    // 调用你原有的统计方法（根据实际方法名调整）
    await visitService.syncVisitStats();
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  } finally {
    await app.close();
  }
}
```

**步骤 b：在 `vercel.json` 中配置 Cron 定时**（见下一步 2.5）

### 2.5 创建 `vercel.json`

在 `server/` 根目录创建 `vercel.json`：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["src/**", "package.json"]
      }
    },
    {
      "src": "api/cron.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["src/**", "package.json"]
      }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index" },
    { "src": "/(.*)", "dest": "/api/index" }
  ],
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 * * * *"
    }
  ]
}
```

> `schedule: "0 * * * *"` 表示每小时执行一次，按需调整。

### 2.6 修改环境变量加载方式

`main.ts` 中用 `dotenv.config({ path: join(process.cwd(), '..', '.env') })` 加载根目录 `.env`。在 Vercel 上环境变量通过平台注入，不需要 dotenv 加载文件。

修改 `server/src/main.ts`，将 dotenv 行改为（仅在本地加载，生产环境跳过）：

```typescript
// 仅本地开发加载 .env；Vercel 会自动注入环境变量
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config({ path: join(process.cwd(), '..', '.env') });
}
```

> 或者最简单的方式：直接删掉那行 dotenv，本地开发时把 `.env` 放到 `server/` 目录并用默认 `.env` 加载。两种方式选一种即可。

---

## 第三部分：在 Vercel 创建后端项目

1. 打开 https://vercel.com/dashboard → **Add New Project**
2. Import 你的 GitHub 仓库
3. **配置项目**：
   - **Project Name**: `portfolio-api`
   - **Framework Preset**: Other
   - **Root Directory**: 点击 Edit，选择 `server`
   - **Build Command**: `npm run build`
   - **Output Directory**: 留空
   - **Install Command**: `npm install`
4. 展开 **Environment Variables**，逐条添加：

   | Key | Value（替换为你的实际值） |
   |-----|--------------------------|
   | `DATABASE_HOST` | `ep-xxx.sg1-0.aws.neon.tech`（Neon 主机） |
   | `DATABASE_PORT` | `5432` |
   | `DATABASE_NAME` | `portfolio` |
   | `DATABASE_USER` | `portfolio_user` |
   | `DATABASE_PASSWORD` | Neon 数据库密码 |
   | `DATABASE_SSL` | `true`（Neon 要求 SSL） |
   | `REDIS_HOST` | Upstash endpoint（`xxx.upstash.io`） |
   | `REDIS_PORT` | `6379` |
   | `REDIS_PASSWORD` | Upstash password |
   | `REDIS_TLS` | `true` |
   | `JWT_SECRET` | 生成一个强随机字符串 |
   | `JWT_EXPIRES_IN` | `7d` |
   | `GITHUB_CLIENT_ID` | 你的 GitHub OAuth App ID |
   | `GITHUB_CLIENT_SECRET` | 你的 GitHub OAuth Secret |
   | `GITHUB_CALLBACK_URL` | `https://portfolio-api.vercel.app/api/auth/github/callback`（部署后换成实际域名） |
   | `ALLOWED_GITHUB_IDS` | 你的 GitHub 数字 ID |
   | `FRONTEND_URL` | `https://portfolio.vercel.app`（前端域名） |
   | `BLOB_READ_WRITE_TOKEN` | Vercel Blob Token（下一步获取） |
   | `CRON_SECRET` | 随机字符串（保护 Cron 接口） |

5. 点击 **Deploy**
6. 部署完成后记录域名，如 `https://portfolio-api-xxx.vercel.app`

> **如果数据库连接报错**：TypeORM 连接 Neon 需要开启 SSL。在 `app.module.ts` 的 TypeORM 配置中确保有 `ssl: process.env.DATABASE_SSL === 'true'`（见下方代码补丁）。

### 3.1 TypeORM SSL 配置补丁

打开 `server/src/app.module.ts`，在 TypeOrmModule 配置中添加 ssl：

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  // 生产环境连接 Neon/Supabase 需要 SSL
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [...],
  synchronize: true,
  ...
}),
```

### 3.2 获取 Vercel Blob Token

1. 在 Vercel Dashboard 进入你的 **portfolio-api** 项目
2. **Storage** → **Create** → **Blob Store**
3. 命名为 `portfolio-blob`
4. 创建后复制 **BLOB_READ_WRITE_TOKEN**
5. 把它填入项目的环境变量 `BLOB_READ_WRITE_TOKEN`

---

## 第四部分：前端（Next.js）部署

### 4.1 安装 Vercel Analytics 和 Speed Insights

```powershell
cd web
npm install @vercel/analytics @vercel/speed-insights
```

### 4.2 在 Layout 中接入

打开 `web/app/layout.tsx`，在 `<body>` 内部最末尾添加两个组件：

```tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// ... 在 return 的 JSX 中，body 闭合标签前添加：
export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Analytics />          {/* 访问分析 */}
        <SpeedInsights />     {/* 性能监控 */}
      </body>
    </html>
  );
}
```

> 这两个组件在本地开发时不工作，部署到 Vercel 后自动激活。

### 4.3 修改 API 地址配置

打开 `web/lib/api.ts`，确保 `API_BASE_URL` 能在 Vercel 环境正确读取：

```typescript
// 本地开发用 localhost:3001，Vercel 环境用后端域名
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

这个项目里应该已经这样写了，确认即可。

### 4.4 在 Vercel 创建前端项目

1. Vercel Dashboard → **Add New Project** → Import 同一个 GitHub 仓库
2. **配置项目**：
   - **Project Name**: `portfolio`
   - **Framework Preset**: Next.js（自动识别）
   - **Root Directory**: 选择 `web`
   - **Build Command**: 保持默认（`next build`）
   - 其他默认
3. **Environment Variables**：

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://portfolio-api-xxx.vercel.app`（后端域名） |
   | `NEXT_PUBLIC_SITE_URL` | `https://portfolio.vercel.app`（前端域名） |

4. 点击 **Deploy**

---

## 第五部分：GitHub OAuth 生产环境配置

部署后登录功能需要更新 OAuth 回调地址。

1. 打开 https://github.com/settings/developers
2. 找到你为本项目创建的 OAuth App → **Edit**
3. 更新 **Authorization callback URL**：
   ```
   https://portfolio-api-xxx.vercel.app/api/auth/github/callback
   ```
4. 更新 **Homepage URL**：
   ```
   https://portfolio.vercel.app
   ```
5. 确认后端环境变量中 `GITHUB_CALLBACK_URL` 和此一致

---

## 第六部分：验证部署

| 验证项 | 方法 |
|--------|------|
| 前端访问 | 打开 `https://portfolio.vercel.app`，页面正常显示 |
| 后端 API | 浏览器打开 `https://portfolio-api-xxx.vercel.app/api/profile`，返回 JSON |
| 后台登录 | 打开 `https://portfolio.vercel.app/admin/login`，GitHub 登录成功 |
| 头像上传 | 后台个人信息上传图片，前台正常显示 |
| Analytics | Vercel Dashboard → portfolio 项目 → **Analytics** 标签页查看数据 |
| Speed Insights | Vercel Dashboard → portfolio 项目 → **Speed Insights** 标签页查看指标 |

---

## 第七部分：后续更新部署

### 7.1 自动部署（推荐）

代码推送到 GitHub `main` 分支后，Vercel 会**自动检测并重新部署**两个项目：

```powershell
git add .
git commit -m "你的修改说明"
git push origin main
```

推送后约 1-3 分钟，两个项目会自动构建部署。可在 Vercel Dashboard 查看部署进度。

### 7.2 仅更新某个项目

如果只改了前端代码，但不想等后端重新部署：

```powershell
# 只改了 web/ 下的文件，push 后前端自动部署，后端代码无变化会快速跳过
git push origin main
```

Vercel 会检测变更的目录，无变化的项目构建很快跳过。

### 7.3 回滚到旧版本

Vercel Dashboard → 项目 → **Deployments** → 找到历史部署 → 点击 **...** → **Promote to Production**

---

## 附录 A：完整环境变量清单

### 后端项目（portfolio-api）

```
# 数据库
DATABASE_HOST=ep-xxx.neon.tech
DATABASE_PORT=5432
DATABASE_NAME=portfolio
DATABASE_USER=portfolio_user
DATABASE_PASSWORD=你的Neon密码
DATABASE_SSL=true

# Redis
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=你的Upstash密码
REDIS_TLS=true

# JWT
JWT_SECRET=随机强密码字符串
JWT_EXPIRES_IN=7d

# GitHub OAuth
GITHUB_CLIENT_ID=你的ClientID
GITHUB_CLIENT_SECRET=你的Secret
GITHUB_CALLBACK_URL=https://portfolio-api.vercel.app/api/auth/github/callback
ALLOWED_GITHUB_IDS=你的GitHub数字ID

# 前端地址（CORS 白名单）
FRONTEND_URL=https://portfolio.vercel.app

# Vercel Blob（文件上传）
BLOB_READ_WRITE_TOKEN=你的BlobToken

# Cron 保护
CRON_SECRET=随机字符串
```

### 前端项目（portfolio）

```
NEXT_PUBLIC_API_URL=https://portfolio-api.vercel.app
NEXT_PUBLIC_SITE_URL=https://portfolio.vercel.app
```

---

## 附录 B：常见问题

### Q1：后端部署后 API 返回 500

**最常见原因**：数据库 SSL 未开启。确认 `app.module.ts` 中 TypeORM 配置了 `ssl: { rejectUnauthorized: false }`，且环境变量 `DATABASE_SSL=true`。

### Q2：GitHub 登录回调报错 "Redirect URI mismatch"

`GITHUB_CALLBACK_URL` 环境变量的值，必须和 GitHub OAuth App 里的 Authorization callback URL **完全一致**（包括协议 https、路径、末尾无斜杠等）。

### Q3：头像上传失败

确认 Vercel Blob Store 已创建，且 `BLOB_READ_WRITE_TOKEN` 环境变量已设置。在 Vercel Dashboard → Storage 检查 Blob Store 状态。

### Q4：Serverless 冷启动慢

NestJS 首次冷启动需要初始化依赖注入，可能 2-3 秒。这是 Serverless 固有特性。可通过以下方式优化：
- 精简 `@nestjs/schedule`、`@nestjs/serve-static` 等 Serverless 不需要的模块
- 考虑用 Vercel Pro 计划提升函数内存（256MB → 1GB）

### Q5：Redis 连接频繁断开

Serverless 模式下 `ioredis` 使用 TCP 长连接会不稳定。建议改用 Upstash 的 REST API 模式（`@upstash/redis` 包），完全基于 HTTP，无连接池问题。

---

## 附录 C：改造检查清单

部署前逐项确认：

- [ ] Neon PostgreSQL 已创建，连接串已记录
- [ ] Upstash Redis 已创建，凭据已记录
- [ ] `@codegenie/serverless-express` 已安装
- [ ] `server/api/index.ts` 已创建（Serverless 入口）
- [ ] `server/api/cron.ts` 已创建（定时任务，如需要）
- [ ] 文件上传已改为 Vercel Blob（`memoryStorage` + `put`）
- [ ] `server/vercel.json` 已创建
- [ ] `app.module.ts` TypeORM 已添加 SSL 配置
- [ ] `main.ts` dotenv 加载已适配生产环境
- [ ] 后端 Vercel 项目已创建，环境变量已配置
- [ ] 前端 `@vercel/analytics` 和 `@vercel/speed-insights` 已安装并接入
- [ ] 前端 Vercel 项目已创建，环境变量已配置
- [ ] GitHub OAuth App 回调地址已更新为生产域名
- [ ] 部署后 API、登录、上传、Analytics 均验证通过
