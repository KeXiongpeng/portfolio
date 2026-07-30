# JWT 账号密码 + GitHub 双登录认证设计

> 日期：2026-07-30
> 状态：已批准，待实现

## 背景

当前后台仅支持 GitHub OAuth 登录（通过 `ALLOWED_GITHUB_IDS` 白名单）。需新增账号密码注册/登录（JWT），GitHub 降为第三方可选登录方式。管理后台登录页优先展示账号密码登录，其次提供 GitHub 授权。

## 需求确认

1. **注册模式**：开放注册，提供注册页面
2. **角色模型**：简化 RBAC（角色表 + 外键），新注册用户为普通 user，需手动提升为 admin
3. **数据组织**：方案 B 账户分离（users 表 + accounts 登录凭据表）
4. **登录优先级**：管理后台优先账号密码登录，GitHub 为次要选项

---

## 一、数据模型模块

### 1.1 roles（角色表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | 主键自增 |
| name | varchar(50) unique | 角色名：`user` / `admin` / `super_admin` |
| description | varchar(200) | 角色描述 |
| created_at | timestamp | 创建时间 |

### 1.2 users（用户基础信息表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | 主键自增 |
| username | varchar(100) | 用户名 |
| email | varchar(200) nullable | 邮箱 |
| avatar_url | varchar(500) nullable | 头像 URL |
| role_id | int FK → roles.id | 角色外键 |
| created_at | timestamp | 创建时间 |

> 变更：移除原 `github_id` 列（迁入 accounts 表），新增 `email`、`role_id` 列。

### 1.3 accounts（登录凭据表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | 主键自增 |
| user_id | int FK → users.id | 关联用户 |
| provider | varchar(20) | 登录方式：`local` / `github` |
| provider_user_id | varchar(100) | local=用户名, github=github_id |
| password_hash | varchar(200) nullable | bcrypt 密码哈希（仅 local 有值） |
| created_at | timestamp | 创建时间 |

**唯一约束**：`(provider, provider_user_id)` 联合唯一索引，防止重复注册。

### 1.4 初始管理员引导

新注册用户均为普通 user 角色，需要引导首个管理员：

- 后端启动时（`OnApplicationBootstrap`）检测：若无 admin 角色用户，则从环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` 自动创建一个 super_admin 账号（仅首次执行）
- 后续管理员通过手动修改数据库 `users.role_id` 提升

### 1.5 GitHub 白名单兼容

保留 `ALLOWED_GITHUB_IDS` 环境变量。白名单内的 GitHub 用户登录后自动赋予 admin 角色，保持站长现有登录体验。

---

## 二、后端 API 模块

### 2.1 接口清单

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 账号密码注册 | 公开 |
| POST | `/api/auth/login` | 账号密码登录 | 公开 |
| GET | `/api/auth/github` | GitHub 登录入口 | 公开 |
| GET | `/api/auth/github/callback` | GitHub 回调 | 公开 |
| POST | `/api/auth/logout` | 登出 | - |
| POST | `/api/auth/refresh` | 刷新 token | 需登录 |

### 2.2 注册流程 `AuthService.register(username, password, email)`

1. 检查 `(provider=local, provider_user_id=username)` 是否已存在 → 已存在返回 409
2. bcrypt 哈希密码（salt rounds 10）
3. 查询/创建 `user` 角色（name='user'）作为默认角色
4. 创建 user 记录（role_id = user 角色 id）
5. 创建 account 记录（provider=local, provider_user_id=username, password_hash）
6. 签发 JWT 返回

### 2.3 登录流程 `AuthService.validateLocalUser(username, password)`

1. 查 account（provider=local, provider_user_id=username）→ 不存在返回 401
2. bcrypt.compare(password, password_hash) → 不匹配返回 401
3. 返回关联的 user 记录，签发 JWT

### 2.4 GitHub 流程重构 `AuthService.validateGithubUser`

1. 查 account（provider=github, provider_user_id=github_id）
2. 不存在：若在 `ALLOWED_GITHUB_IDS` 白名单则 role=admin，否则 role=user；创建 user + account
3. 已存在：按需更新 user.avatar_url、user.username
4. 返回 user 记录

### 2.5 JWT Payload 统一

```typescript
{ sub: user.id, username: user.username, role: role.name }
```

> 去掉原 payload 中的 `githubId`（已迁入 accounts 表）。

### 2.6 权限守卫

新增 `RolesGuard` + `@Roles('admin')` 装饰器：

- `RolesGuard` 从 JWT 中读取 role，与装饰器要求的角色比对
- 应用到 `/api/admin/*` 路由，只允许 admin 角色访问
- 普通用户即使登录也无法操作后台数据（返回 403）

### 2.7 错误处理

| 场景 | HTTP 状态码 | 说明 |
|------|-------------|------|
| 注册用户名已存在 | 409 Conflict | |
| 登录用户名/密码错误 | 401 Unauthorized | 统一模糊提示，不区分 |
| 普通用户访问 admin 接口 | 403 Forbidden | |

---

## 三、前端页面模块

### 3.1 登录页 `/admin/login`（重构）

布局自上而下：

1. **账号密码登录区**（主要入口）：
   - 用户名输入框
   - 密码输入框
   - 登录按钮（主色调，醒目）
2. **分割线**："或使用以下方式"
3. **GitHub 登录区**（次要选项）：
   - GitHub 授权登录按钮（次要样式）
4. **注册引导**：
   - "没有账号？去注册" 链接 → `/admin/register`

### 3.2 注册页 `/admin/register`（新增）

表单字段：

- 用户名（必填）
- 邮箱（必填）
- 密码（必填，最少 6 位）
- 确认密码（必填，需与密码一致）

注册成功后自动登录并跳转 `/admin/dashboard`。

### 3.3 登录态处理

复用现有机制，无需改动：

- 登录/注册成功后后端返回 JWT token
- 通过现有 `/api/auth/set-cookie` 中转路由设置 cookie
- `middleware.ts` 保持不变（仍只检查 token 存在性）

### 3.4 lib/api.ts 新增方法

```typescript
register: (data: { username: string; email: string; password: string }) =>
  fetchApi<{ token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

login: (data: { username: string; password: string }) =>
  fetchApi<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
```

---

## 四、迁移与边界处理模块

### 4.1 数据迁移策略

项目使用 TypeORM `synchronize: true`（开发环境），现有用户数据量极小（仅站长一人）。

迁移步骤（通过 `OnApplicationBootstrap` 钩子在启动时执行）：

1. 创建默认角色记录（user / admin / super_admin）
2. 检测旧 `users` 表是否仍有 `github_id` 列
3. 若有，将现有 GitHub 用户迁移到 accounts 表（provider=github）
4. 创建初始管理员（若配置了 ADMIN_USERNAME 环境变量且无 admin 存在）

### 4.2 密码安全

- 使用 `bcrypt` 库，salt rounds = 10
- 密码哈希永不返回给前端
- 登录错误统一模糊提示

### 4.3 新增环境变量

```env
ADMIN_USERNAME=admin        # 初始管理员用户名
ADMIN_PASSWORD=<密码>       # 初始管理员密码
ADMIN_EMAIL=admin@xx.com    # 初始管理员邮箱
# 以下为已有变量，保留
ALLOWED_GITHUB_IDS=123,456  # GitHub 白名单（自动 admin）
JWT_SECRET=<密钥>
JWT_EXPIRES_IN=7d
```

### 4.4 不在本次范围内（YAGNI）

- 忘记密码 / 邮箱验证流程
- 用户角色管理界面（手动改库提升）
- 账号绑定/解绑（一个账号关联多种登录方式）
- 独立权限表（permission table）

---

## 五、技术依赖

### 5.1 后端新增依赖

- `bcrypt` — 密码哈希

### 5.2 新增文件清单

**后端：**
- `server/src/entities/role.entity.ts`
- `server/src/entities/account.entity.ts`
- `server/src/common/guards/roles.guard.ts`
- `server/src/common/decorators/roles.decorator.ts`
- `server/src/modules/auth/dto/register.dto.ts`
- `server/src/modules/auth/dto/login.dto.ts`
- `server/src/modules/auth/seed.service.ts`（初始管理员引导）

**前端：**
- `web/app/admin/register/page.tsx`

### 5.3 修改文件清单

**后端：**
- `server/src/entities/user.entity.ts`（移除 github_id，新增 role_id、email）
- `server/src/entities/index.ts`（导出新实体）
- `server/src/modules/auth/auth.service.ts`（新增 register/login，重构 GitHub）
- `server/src/modules/auth/auth.controller.ts`（新增 register/login 路由）
- `server/src/modules/auth/auth.module.ts`（注册新 provider）
- `server/src/modules/auth/jwt.strategy.ts`（payload 去掉 githubId）
- `server/src/app.module.ts`（迁移钩子）
- `server/package.json`（新增 bcrypt 依赖）

**前端：**
- `web/app/admin/login/page.tsx`（重构为账号密码优先）
- `web/lib/api.ts`（新增 register/login 方法）
