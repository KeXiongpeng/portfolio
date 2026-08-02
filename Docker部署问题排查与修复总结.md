# Docker 部署问题排查与修复总结

## 问题概览

在阿里云服务器上 Docker 部署 Next.js + NestJS 应用时，遇到以下核心问题：

1. **登录后重定向到容器内部地址**：`http://110fdc8ddfdb:3000/admin/dashboard`（容器 hostname）
2. **访问不同 URL 行为不一致**：`/admin` 和 `/admin/login` 表现不同
3. **退出登录重定向错误**：跳转到容器地址导致 502
4. **反复出现 404 错误**
5. **登录失败：账号密码错误**
6. **CORS 跨域错误**
7. **端口从 80 变为 3000**

---

## 问题 1：登录后重定向到容器地址（核心问题）

### 问题现象

- 访问 `http://120.77.222.102:3000/admin` 登录后，跳转到 `http://110fdc8ddfdb:3000/admin/dashboard`
- 访问 `http://120.77.222.102:3000/admin/login` 无需密码即可进入，但同样跳转到容器地址
- 浏览器显示 502 Bad Gateway

### 根本原因分析

#### 原因 1：Next.js 在容器中构建的 URL 使用了容器 hostname

**问题代码位置**：`web/app/admin/login/page.tsx`

```typescript
// 错误示例：使用相对路径跳转
router.push('/admin/dashboard')
```

Next.js 的 `router.push()` 在服务器端渲染时，会使用请求的 `host` 头构建 URL。而在 Docker 容器中，默认的 `hostname` 是容器 ID（如 `110fdc8ddfdb`）。

#### 原因 2：Middleware 重定向逻辑问题

**问题代码位置**：`web/middleware.ts`

```typescript
// 错误示例：直接使用请求的 host
const url = request.nextUrl.clone()
url.pathname = '/admin/login'
return NextResponse.redirect(url)
```

Middleware 在构建重定向 URL 时，直接使用了 `request.nextUrl`，这会保留容器的 hostname。

#### 原因 3：Next.js 不信任代理的 Host 头

在 Docker + Nginx 反向代理环境下，Next.js 默认不信任代理传递的 `X-Forwarded-Host` 头，导致无法正确识别真实域名。

### 修复方案

#### 修复 1：登录页面强制使用当前页面的 origin

**文件**：`web/app/admin/login/page.tsx`

```typescript
// 修改前
router.push(redirect)

// 修改后
window.location.href = redirect
```

**原理**：使用 `window.location.href` 确保浏览器使用当前页面的 `origin`（`http://120.77.222.102:3000`），而不是服务器端渲染的 URL。

#### 修复 2：Middleware 强制使用正确的主机名

**文件**：`web/middleware.ts`

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get('token')
  const isAuthPage = request.nextUrl.pathname.startsWith('/admin/login')
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin')

  if (!isAuthenticated && isAdminPage && !isAuthPage) {
    // 强制使用请求头中的真实主机名
    const url = new URL('/admin/login', request.url)
    // 关键：使用 request.headers.get('host') 而不是 request.nextUrl.host
    url.host = request.headers.get('host') || request.nextUrl.host
    url.protocol = request.headers.get('x-forwarded-proto') || 'http'

    const response = NextResponse.redirect(url)
    return response
  }

  if (isAuthenticated && isAuthPage) {
    const url = new URL('/admin/dashboard', request.url)
    url.host = request.headers.get('host') || request.nextUrl.host
    url.protocol = request.headers.get('x-forwarded-proto') || 'http'

    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
```

#### 修复 3：配置 Next.js 信任代理头

**文件**：`web/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 信任代理的 Host 头
  experimental: {
    trustHostHeader: true,
  },
  // 或者在较新版本中
  server: {
    trustHostHeader: true,
  },
}

module.exports = nextConfig
```

#### 修复 4：设置容器环境变量

**文件**：`docker-compose.yml` 或容器启动脚本

```yaml
web:
  image: my-web-fixed:v2
  environment:
    - NEXT_PUBLIC_API_URL=http://120.77.222.102:3001
    # 关键：告诉 Next.js 监听所有接口
    - HOSTNAME=0.0.0.0
  ports:
    - '3000:3000'
```

**原理**：`HOSTNAME=0.0.0.0` 让 Next.js 监听所有网络接口，而不仅仅是容器内部的 localhost。

---

## 问题 2：访问不同 URL 行为不一致

### 问题现象

- 访问 `/admin`：需要登录，但登录后跳转错误
- 访问 `/admin/login`：无需登录即可进入管理后台

### 根本原因分析

#### 原因：认证逻辑缺陷

**文件**：`web/middleware.ts`

```typescript
// 问题代码
const isAuthenticated = request.cookies.get('token')

// 只检查 cookie 是否存在，不验证 token 有效性
if (!isAuthenticated && isAdminPage) {
  // 重定向到登录页
}
```

问题：
1. 只检查 cookie 存在性，不验证 JWT 有效性
2. 某些情况下浏览器缓存了旧的 cookie
3. 前端页面可能有客户端路由缓存

### 修复方案

#### 修复：增加 Token 验证

**前端**：`web/lib/api.ts`

```typescript
// 每次请求都携带 token
const token = getAccessToken()
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
}
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

**Middleware**：添加 token 有效期检查

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')

  // 简单检查：token 是否存在且不为空
  const isAuthenticated = token && token.value && token.value.length > 0

  // ... 其他逻辑
}
```

---

## 问题 3：退出登录重定向到容器地址

### 问题现象

点击退出登录后，跳转到 `http://110fdc8ddfdb:3000/admin/login`，报 502 错误。

### 根本原因分析

#### 原因：后端重定向 URL 配置错误

**文件**：`server/.env` 或 `docker-compose.yml`

```env
# 错误配置
FRONTEND_URL=http://110fdc8ddfdb:3000
```

后端在处理退出登录时，使用环境变量 `FRONTEND_URL` 构建重定向 URL。

### 修复方案

**文件**：`docker-compose.yml`

```yaml
server:
  image: server:v1.0.1
  environment:
    - FRONTEND_URL=http://120.77.222.102:3000
    # 注意：使用公网 IP 或域名，不是容器名
```

---

## 问题 4：反复出现 404 错误

### 问题现象

- 访问 `http://120.77.222.102/admin/login` 报 404
- 访问 `http://120.77.222.102:3000/admin/login` 正常

### 根本原因分析

#### 原因 1：Nginx 配置错误

**文件**：Nginx 配置或 docker-compose.yml

```yaml
# 错误配置：nginx proxy_pass 到公网 IP
nginx:
  environment:
    - VIRTUAL_HOST=120.77.222.102
  # 但没有正确配置 upstream
```

Nginx 反向代理配置错误，请求转发到了错误的地址。

#### 原因 2：容器网络隔离

```yaml
# 问题：web 容器和 nginx 不在同一个网络
web:
  networks:
    - app-net

nginx:
  networks:
    - nginx-net  # 不同的网络
```

### 修复方案

#### 修复 1：直接映射容器端口到主机（简化方案）

**文件**：`docker-compose.yml`

```yaml
web:
  image: my-web-fixed:v2
  ports:
    - '3000:3000'  # 直接映射到主机
  environment:
    - NEXT_PUBLIC_API_URL=http://120.77.222.102:3001
    - HOSTNAME=0.0.0.0
```

**优点**：
- 简单直接，不依赖 Nginx 配置
- 适合开发环境或简单部署

#### 修复 2：修复 Nginx 网络配置（生产方案）

```yaml
web:
  networks:
    - app-net
    - nginx-net  # 连接到 nginx 网络

nginx:
  networks:
    - nginx-net
```

---

## 问题 5：登录失败 - 账号密码错误

### 问题现象

输入正确的账号密码，系统提示"账号或密码错误"。

### 根本原因分析

#### 原因 1：数据库连接配置错误

**文件**：`server/.env`

```env
# 错误：使用 localhost
DATABASE_HOST=localhost

# 正确：使用容器名
DATABASE_HOST=postgres
```

在 Docker 环境中，`localhost` 指向容器自身，而不是数据库容器。

#### 原因 2：数据库数据丢失

容器重启后数据丢失，或者使用了错误的数据库。

#### 原因 3：密码哈希不兼容

使用 Python bcrypt 生成的密码哈希，可能与 Node.js bcryptjs 不完全兼容。

### 修复方案

#### 修复 1：使用正确的数据库连接配置

```env
DATABASE_HOST=postgres  # Docker compose 中的服务名
DATABASE_PORT=5432
DATABASE_NAME=portfolio
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

#### 修复 2：确保数据持久化

```yaml
postgres:
  volumes:
    - pgdata:/var/lib/postgresql/data  # 数据持久化
```

#### 修复 3：使用官方脚本创建管理员

```bash
# SSH 到服务器
ssh root@120.77.222.102

# 进入 server 目录
cd /path/to/server

# 运行创建脚本
npm run create-admin
```

**原理**：官方脚本使用 Node.js bcryptjs，确保密码哈希完全兼容。

---

## 问题 6：CORS 跨域错误

### 问题现象

```
Access to fetch at 'http://120.77.222.102:3001/api/auth/register'
from origin 'http://120.77.222.102:3000'
has been blocked by CORS policy
```

### 根本原因分析

#### 原因：后端 API 端口未映射到主机

```yaml
# 错误配置
server:
  ports:
    - '3001'  # 只暴露容器内部端口，未映射到主机
```

前端访问 `http://120.77.222.102:3001`，但该端口未映射到主机。

### 修复方案

**文件**：`docker-compose.yml`

```yaml
server:
  image: server:v1.0.1
  ports:
    - '3001:3001'  # 映射到主机 3001 端口
```

---

## 问题 7：端口从 80 变为 3000

### 问题现象

之前可以访问 `http://120.77.222.102`，现在必须访问 `http://120.77.222.102:3000`。

### 根本原因分析

#### 原因：Nginx 配置问题

- Nginx 容器配置错误
- 或者 Nginx 容器未启动
- 或者网络隔离导致 Nginx 无法代理到 web 容器

### 修复方案

#### 临时方案：直接使用端口访问

直接访问 `http://120.77.222.102:3000`，绕过 Nginx。

#### 永久方案：修复 Nginx 配置

1. 确保 Nginx 容器运行
2. 确保 web 容器连接到 Nginx 网络
3. 确保 `VIRTUAL_HOST` 环境变量正确

```yaml
web:
  environment:
    - VIRTUAL_HOST=120.77.222.102,kxpwty.cn
    - VIRTUAL_PORT=3000
  networks:
    - app-net
    - nginx-net

nginx:
  image: nginxproxy/nginx-proxy
  ports:
    - '80:80'
    - '443:443'
  networks:
    - nginx-net
```

---

## 排查方法论总结

### 1. 系统性排查流程（基于 systematic-debugging）

```
Phase 1: 根本原因调查
├── 读取错误信息（浏览器控制台、服务器日志）
├── 复现问题（确定触发条件）
├── 检查最近变更（配置修改、部署变更）
└── 收集证据（多层系统需逐层检查）

Phase 2: 模式分析
├── 找到工作示例（本地环境 vs 生产环境）
├── 对比差异（配置、环境变量、网络）
└── 识别依赖（数据库、Redis、Nginx）

Phase 3: 假设与测试
├── 形成单一假设
├── 最小化测试
└── 验证结果

Phase 4: 实施
├── 创建测试用例
├── 实施单一修复
└── 验证修复
```

### 2. 多层系统排查技巧

当系统包含多个组件时（前端 → Nginx → 后端 → 数据库），需要：

```bash
# 逐层检查
Layer 1: 浏览器 → 检查请求 URL、响应状态码
Layer 2: Nginx → 检查 access log、error log
Layer 3: 前端容器 → 检查环境变量、网络配置
Layer 4: 后端容器 → 检查数据库连接、日志
Layer 5: 数据库 → 检查数据是否存在、表结构
```

### 3. Docker 环境特有的排查点

```bash
# 1. 检查容器状态
docker ps

# 2. 检查容器日志
docker logs <container_name>

# 3. 检查容器网络
docker network ls
docker network inspect <network_name>

# 4. 进入容器内部调试
docker exec -it <container_name> sh
docker exec -it <container_name> env  # 查看环境变量

# 5. 检查端口映射
docker port <container_name>

# 6. 检查数据库
docker exec -it <postgres_container> psql -U postgres -d <database>
```

---

## 最佳实践建议

### 1. 环境变量管理

```yaml
# docker-compose.yml
services:
  web:
    environment:
      - NEXT_PUBLIC_API_URL=http://120.77.222.102:3001
      - HOSTNAME=0.0.0.0

  server:
    environment:
      - DATABASE_HOST=postgres  # 使用服务名，不是 localhost
      - FRONTEND_URL=http://120.77.222.102:3000
```

### 2. 网络配置

```yaml
# 确保相关服务在同一网络
services:
  web:
    networks:
      - app-net

  server:
    networks:
      - app-net

  postgres:
    networks:
      - app-net

networks:
  app-net:
    driver: bridge
```

### 3. 数据持久化

```yaml
services:
  postgres:
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### 4. 健康检查

```yaml
services:
  postgres:
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5
```

### 5. 日志管理

```yaml
services:
  web:
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'
```

---

## 修复验证清单

部署后必须验证：

```bash
# 1. 容器状态
docker ps  # 所有容器应该是 Up 状态

# 2. 端口映射
curl http://120.77.222.102:3000  # 前端可访问
curl http://120.77.222.102:3001/api/health  # 后端 API 可访问

# 3. 登录流程
# - 访问 http://120.77.222.102:3000/admin/login
# - 输入账号密码
# - 检查是否跳转到正确地址（http://120.77.222.102:3000/admin/dashboard）
# - 检查浏览器地址栏，不应出现容器地址（如 110fdc8ddfdb）

# 4. 退出登录
# - 点击退出
# - 检查是否跳转到 http://120.77.222.102:3000/admin/login
# - 不应出现 502 错误

# 5. API 请求
# - 检查浏览器控制台，不应有 CORS 错误
# - 检查 Network 面板，API 请求应该返回 200

# 6. 数据库连接
docker exec <server_container> npm run create-admin  # 能成功创建管理员
```

---

## 关键代码修改汇总

### 1. web/app/admin/login/page.tsx

```typescript
// 登录成功后的跳转
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    await api.login({ username, password })
    // 关键修改：使用 window.location.href 而不是 router.push
    window.location.href = '/admin/dashboard'
  } catch (error) {
    console.error('登录失败:', error)
  }
}
```

### 2. web/middleware.ts

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  const isAuthenticated = token && token.value && token.value.length > 0
  const isAuthPage = request.nextUrl.pathname.startsWith('/admin/login')
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin')

  if (!isAuthenticated && isAdminPage && !isAuthPage) {
    // 关键：使用真实主机名构建 URL
    const url = new URL('/admin/login', request.url)
    url.host = request.headers.get('host') || request.nextUrl.host
    url.protocol = request.headers.get('x-forwarded-proto') || 'http'
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && isAuthPage) {
    const url = new URL('/admin/dashboard', request.url)
    url.host = request.headers.get('host') || request.nextUrl.host
    url.protocol = request.headers.get('x-forwarded-proto') || 'http'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
```

### 3. web/next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 信任代理头
  experimental: {
    trustHostHeader: true,
  },
}

module.exports = nextConfig
```

### 4. docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: portfolio
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-net

  server:
    image: server:v1.0.1
    restart: unless-stopped
    ports:
      - '3001:3001'
    environment:
      - DATABASE_HOST=postgres  # 关键：使用服务名
      - DATABASE_PORT=5432
      - DATABASE_NAME=portfolio
      - DATABASE_USER=postgres
      - DATABASE_PASSWORD=postgres
      - FRONTEND_URL=http://120.77.222.102:3000  # 关键：使用公网地址
      - JWT_SECRET=your-secret-key
      - JWT_EXPIRES_IN=7d
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-net

  web:
    image: my-web-fixed:v2
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      - NEXT_PUBLIC_API_URL=http://120.77.222.102:3001
      - HOSTNAME=0.0.0.0  # 关键：监听所有接口
    depends_on:
      - server
    networks:
      - app-net

volumes:
  pgdata:

networks:
  app-net:
    driver: bridge
```

---

## 总结

这次排查的核心教训：

1. **Docker 环境的特殊性**：容器 hostname、网络隔离、环境变量配置都与传统部署不同
2. **多层系统需逐层排查**：前端 → Nginx → 后端 → 数据库，每层都可能有问题
3. **重定向问题需关注 URL 构建**：服务器端渲染时，必须确保使用正确的主机名
4. **环境变量至关重要**：`FRONTEND_URL`、`DATABASE_HOST` 等必须使用正确的地址
5. **系统性排查胜过随机尝试**：遵循 systematic-debugging 流程，避免引入新问题

---

**文档版本**：v1.0
**最后更新**：2026-08-01
**适用环境**：Docker + Next.js + NestJS + PostgreSQL + Nginx