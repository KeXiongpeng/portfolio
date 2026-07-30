# 管理员引导流程安全化设计

**日期**: 2026-07-30
**状态**: 待评审
**作者**: 安全改造（brainstorming 产出）

## 背景

当前项目通过 `.env` 配置初始超级管理员账号：

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
ADMIN_EMAIL=admin@localhost
```

`SeedService.seedInitialAdmin()` 在应用首次启动时（`OnApplicationBootstrap`）读取这三个变量，用 `bcrypt.hash(password, 10)` 哈希后写入 PostgreSQL 的 `accounts.password_hash` 列。

**登录校验路径**（`AuthService.validateLocalUser`）已经正确地从 DB 读取 bcrypt hash 并用 `bcrypt.compare` 比对，不读取 `.env`——这部分是安全的。

### 真实风险

密码本身的哈希存储没问题，风险在于**明文种子密码暴露**：

1. 弱密码 `admin123456` 写死在 `.env` / `.env.example`，开源分发后任何人都能看到。
2. 部署者若忘改 `.env`，线上会用这个公开的默认密码启动，相当于无密码。
3. 即使部署者改了 `.env`，明文密码仍留在配置文件里，有泄露面。

## 目标

- 彻底从代码库和 `.env` 移除明文管理员密码
- 改由部署者在首次部署时**交互式输入**自己的密码，输完即哈希进 DB
- 零默认密码，零明文，符合开源项目惯例（Django `createsuperuser` 模式）
- 对已部署用户零影响（DB 中已存在的 admin 不变）

## 非目标

- 不改动登录/JWT/角色守卫等既有认证逻辑
- 不引入 Redis 存储凭据（当前 bcrypt+PG 已是业界标准，Redis 仅保留短临用途）
- 不做 Web `/setup` 引导页（有抢占风险且改动大，已排除）

## 设计

### 删除项

| 文件 | 变更 |
|------|------|
| `.env` | 删除 `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` 三行（第 33-35 行） |
| `.env.example` | 同步删除上述三行，替换为引导说明注释 |
| `server/src/modules/auth/seed.service.ts` | 删除 `seedInitialAdmin()` 方法（第 84-132 行）及其在 `onApplicationBootstrap()` 的调用（第 20 行） |

> 保留：`seedRoles()` 和 `migrateOldGithubUsers()` 不动，角色初始化照常在应用启动时执行。

### 新增项

**新文件**: `server/src/scripts/create-admin.ts`

独立 CLI 脚本，通过 `NestFactory.createApplicationContext(AppModule)` 复用已配置的 TypeORM 连接和实体，无需自建 DB 客户端。

**`package.json` 新增脚本**:

```json
"create-admin": "ts-node src/scripts/create-admin.ts"
```

### 脚本交互流程

```
$ npm run create-admin

=== 创建管理员账号 ===

用户名 [admin]: <输入或回车默认>
邮箱 [admin@localhost]: <输入或回车默认>
密码 (至少 8 位): ********
确认密码: ********

[校验]
  ✓ 密码长度 ≥ 8
  ✓ 两次输入一致
  ✓ 用户名未被 accounts 表占用
  ⚠ 检测到已存在 admin 角色用户，是否继续？(y/N)   ← 仅当已有 admin 时

✓ 管理员创建成功
  请访问 /admin/login 登录
```

### 校验规则

| 项 | 规则 | 失败处理 |
|----|------|----------|
| 密码长度 | `≥ 8` 字符 | 提示重新输入 |
| 确认密码 | 两次一致 | 提示重新输入 |
| 用户名唯一 | `accounts` 表 `provider='local', provider_user_id` 不存在 | 报错退出 |
| 已有 admin | 查 `users.role_id` 命中 admin/super_admin 角色 | 警告 + 二次确认 |

### 写入逻辑

复用 `SeedService.seedInitialAdmin()` 原有写入方式，保证数据一致：

1. 查 `super_admin` 角色（不存在则 fallback `admin`）
2. `users` 表插入 `{ username, email, role_id }`
3. `bcrypt.hash(password, 10)` → `accounts` 表插入 `{ user_id, provider: 'local', provider_user_id: username, password_hash }`

### 密码掩码实现

使用 Node 内置 `readline`，监听 `keypress` 事件，输出 `*` 替代回显。**不加 `inquirer` / `prompts` 依赖**，保持 `package.json` 干净。处理退格、Ctrl+C 中断。

### 幂等性

脚本可重复执行：
- 用户名已存在 → 报错退出，**不覆盖**已有账号
- 需要改密码 → 后续通过「忘记密码」功能（不在本设计范围）

## 部署流程变化

| 阶段 | 旧流程 | 新流程 |
|------|--------|--------|
| 首次部署 | `.env` 写死 `admin/admin123456` → 启动自动建账号 | 启动应用（仅建角色）→ 运行 `npm run create-admin` 交互输入 |
| 开源分发 | ⚠️ 默认密码暴露在仓库 | ✅ 无默认密码，部署者自设 |
| 升级 | — | 已部署用户 DB 中 admin 已存在，升级无影响 |

## 兼容性

- **已部署用户**：DB 中 admin 已存在，脚本不会动它；升级后 `.env` 删掉的 `ADMIN_*` 不影响运行（登录路径本就不读它们）。
- **角色初始化**：`seedRoles()` 仍随应用启动执行，保证 `super_admin` 角色在运行脚本前已存在。
- **测试**：`auth.service.spec.ts` 不涉及 `seedInitialAdmin`，无需改动。

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| 部署者不知道要跑脚本 | README/Vercel 部署指南补充说明；`SeedService.seedRoles()` 末尾追加日志：检测到 0 个 admin 用户时打印「未检测到管理员，请运行 npm run create-admin」 |
| 容器化环境无法交互 | Docker 部署场景预留 `CREATE_ADMIN_NONINTERACTIVE` 环境变量支持参数化（可选增强，不在本期） |
| 误删 `seedRoles` | 本设计明确只删 `seedInitialAdmin`，不动其他方法 |

## 验证标准

- [ ] `.env` 和 `.env.example` 不再含 `ADMIN_PASSWORD`
- [ ] `grep -r ADMIN_PASSWORD server/src` 无结果
- [ ] 应用正常启动（角色仍初始化）
- [ ] `npm run create-admin` 能成功创建管理员
- [ ] 新管理员可正常登录 `/admin/login`
- [ ] 重复运行脚本对已存在用户名报错
- [ ] 密码 < 8 位被拒
