# 管理员引导流程安全化 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除 `.env` 中明文管理员种子密码，改为交互式 CLI 脚本 `npm run create-admin`，由部署者首次部署时自行输入密码（bcrypt hash 后写入 PostgreSQL）。

**Architecture:** 新增独立 CLI 脚本 `server/src/scripts/create-admin.ts`，通过 `NestFactory.createApplicationContext(AppModule)` 复用现有 TypeORM 连接与实体，读 `.env` 中的 DATABASE_* 配置（可临时指向生产 DB）。删除 `SeedService.seedInitialAdmin()` 及 `.env` 的 `ADMIN_*` 三项；角色初始化 `seedRoles()` 保留。

**Tech Stack:** NestJS 10、TypeORM、bcryptjs、Node 内置 `readline`（不引入新依赖）。

## Global Constraints

- 不改动登录/JWT/角色守卫既有逻辑
- 不引入新 npm 依赖（用内置 `readline` 做密码掩码）
- `seedRoles()` 与 `migrateOldGithubUsers()` 保持不动
- 密码哈希算法沿用 `bcrypt.hash(password, 10)`，与 `auth.service.ts:44` 一致
- 实体字段名：`accounts.provider_user_id`、`accounts.password_hash`、`users.role_id`（来自 [account.entity.ts](file:///c:/Users/sun/Desktop/学习产出/server/src/entities/account.entity.ts)）
- 角色名：`super_admin`（fallback `admin`），来自 [seed.service.ts:26-29](file:///c:/Users/sun/Desktop/学习产出/server/src/modules/auth/seed.service.ts#L26-L29)
- **部署约束**：server 部署在 Vercel serverless（见 [vercel.json](file:///c:/Users/sun/Desktop/学习产出/server/vercel.json)），脚本必须在本地执行；连生产 DB 时通过本地 `.env` 临时写入生产 `DATABASE_*` 值，跑完即删

---

## File Structure

| 文件 | 责任 | 动作 |
|------|------|------|
| `.env` | 本地开发环境变量 | Modify：删 33-35 行 ADMIN_* |
| `.env.example` | 开源分发示例配置 | Modify：删 ADMIN_* + 加注释 |
| `server/src/modules/auth/seed.service.ts` | 应用启动种子数据 | Modify：删 `seedInitialAdmin()` 及调用；`seedRoles()` 末尾加提示日志 |
| `server/src/scripts/create-admin.ts` | 交互式创建管理员 CLI | **Create** |
| `server/package.json` | 脚本注册 | Modify：加 `create-admin` 脚本 |
| `Vercel部署指南.md` | 部署文档 | Modify：首次管理员创建说明 |

---

### Task 1: 移除 `.env` / `.env.example` 的明文种子

**Files:**
- Modify: `c:\Users\sun\Desktop\学习产出\.env` (第 33-35 行)
- Modify: `c:\Users\sun\Desktop\学习产出\.env.example`
- Test: 手动 `grep` 确认无残留

**Interfaces:**
- Produces: `.env` 不再含 `ADMIN_*`，后续任务不依赖它们

- [ ] **Step 1: 修改 `.env`**

把第 32-35 行：
```
# 初始管理员引导（仅首次启动且无 admin 用户时创建）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
ADMIN_EMAIL=admin@localhost
```
替换为：
```
# 初始管理员：请运行 npm run create-admin 交互式创建（server 目录下）
# 不再支持通过 .env 配置明文管理员密码
```

- [ ] **Step 2: 修改 `.env.example`**

先读取 `.env.example` 确认其 ADMIN_* 写法（若存在），删除这三行，替换为与 Step 1 相同的注释。

- [ ] **Step 3: 验证无残留**

Run: `grep -rn "ADMIN_PASSWORD" .env .env.example 2>$null; echo "exit=$LASTEXITCODE"`
Expected: 无输出，exit=1（ripgrep/grep 未匹配）

- [ ] **Step 4: Commit**

```bash
git add .env .env.example
git commit -m "chore: 移除 .env 明文管理员种子配置"
```

---

### Task 2: 清理 `SeedService.seedInitialAdmin()`，加缺失提示日志

**Files:**
- Modify: `c:\Users\sun\Desktop\学习产出\server\src\modules\auth\seed.service.ts`
- Test: `server/src/modules/auth/auth.service.spec.ts`（确认不被破坏）+ 应用启动日志

**Interfaces:**
- Consumes: `Role`、`User` 实体（保留）
- Produces: `seedRoles()` 在无 admin 时打印日志，提示运行 `npm run create-admin`

- [ ] **Step 1: 修改 `onApplicationBootstrap`**

把 [seed.service.ts:17-21](file:///c:/Users/sun/Desktop/学习产出/server/src/modules/auth/seed.service.ts#L17-L21)：
```ts
  async onApplicationBootstrap() {
    await this.seedRoles();
    await this.migrateOldGithubUsers();
    await this.seedInitialAdmin();
  }
```
改为：
```ts
  async onApplicationBootstrap() {
    await this.seedRoles();
    await this.migrateOldGithubUsers();
    await this.warnIfNoAdmin();
  }
```

- [ ] **Step 2: 删除 `seedInitialAdmin` 方法**

删除 [seed.service.ts:84-132](file:///c:/Users/sun/Desktop/学习产出/server/src/modules/auth/seed.service.ts#L84-L132) 整个 `private async seedInitialAdmin()` 方法。

- [ ] **Step 3: 新增 `warnIfNoAdmin` 方法**

在 `seedRoles()` 方法后面追加：
```ts
  /** 无管理员时打印提示（不自动创建） */
  private async warnIfNoAdmin() {
    const adminRole = await this.roleRepo.findOne({ where: { name: 'super_admin' } });
    const fallbackAdmin = await this.roleRepo.findOne({ where: { name: 'admin' } });
    const roleId = adminRole?.id || fallbackAdmin?.id;
    if (!roleId) return; // 角色尚未初始化，下次启动再提示

    const existing = await this.userRepo.findOne({ where: { role_id: roleId } });
    if (!existing) {
      this.logger.warn('未检测到管理员账号。请在 server 目录运行 `npm run create-admin` 创建首个管理员。');
    }
  }
```

- [ ] **Step 4: 验证编译**

Run: `cd server; npm run build`
Expected: 编译通过，无 TS 错误

- [ ] **Step 5: 验证既有测试不破**

Run: `cd server; npm run test`
Expected: `auth.service.spec.ts` 全部通过

- [ ] **Step 6: 启动应用验证日志**

Run: `cd server; npm run start:dev`
Expected: 启动日志出现 `未检测到管理员账号。请在 server 目录运行 npm run create-admin 创建首个管理员。`（仅当 DB 中无 admin 时）

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/auth/seed.service.ts
git commit -m "refactor(seed): 移除 seedInitialAdmin，改为提示运行 create-admin 脚本"
```

---

### Task 3: 新建交互式 CLI 脚本 `create-admin.ts`

**Files:**
- Create: `c:\Users\sun\Desktop\学习产出\server\src\scripts\create-admin.ts`

**Interfaces:**
- Consumes: `AppModule`（已注册 TypeORM + 所有实体 + Redis）；`bcryptjs`；Node `readline`
- Produces: 可执行入口 `npm run create-admin`，写入 `users` + `accounts` 表

- [ ] **Step 1: 创建脚本文件**

写入 `server/src/scripts/create-admin.ts`：

```ts
// server/src/scripts/create-admin.ts
// 交互式创建管理员账号。用法：npm run create-admin
// 连生产 DB 时：在 server/.env 临时填入生产 DATABASE_*，跑完即删
import 'dotenv/config';
import * as readline from 'readline';
import * as bcrypt from 'bcryptjs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, Account, Role } from '../entities';

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));
}

/** 掩码输入密码（回显 *，支持退格/Ctrl+C） */
function askPassword(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let pw = '';
    stdout.write(prompt);
    // 关键：监听 keystroke 需要保证 stdin 为 TTY 且 raw 模式
    if (stdin.isTTY) stdin.setRawMode(true);

    const onData = (ch: Buffer) => {
      const c = ch.toString();
      // Ctrl+C
      if (c === '\u0003') {
        stdout.write('\n');
        process.exit(0);
      }
      // 回车
      if (c === '\r' || c === '\n') {
        stdout.write('\n');
        cleanup();
        resolve(pw);
        return;
      }
      // 退格
      if (c === '\u007F' || c === '\b') {
        if (pw.length > 0) {
          pw = pw.slice(0, -1);
          stdout.write('\b \b');
        }
        return;
      }
      // 普通字符
      pw += c;
      stdout.write('*');
    };

    function cleanup() {
      stdin.removeListener('data', onData);
      if (stdin.isTTY) stdin.setRawMode(false);
    }

    stdin.on('data', onData);
  });
}

async function main() {
  console.log('\n=== 创建管理员账号 ===\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const userRepo = app.get<User>(getRepositoryToken(User) as any) as any;
    const accountRepo = app.get<Account>(getRepositoryToken(Account) as any) as any;
    const roleRepo = app.get<Role>(getRepositoryToken(Role) as any) as any;

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const username = (await ask(rl, '用户名 [admin]: ')) || 'admin';
    const email = (await ask(rl, '邮箱 [admin@localhost]: ')) || 'admin@localhost';

    // 密码输入 + 校验
    let password: string;
    while (true) {
      password = await askPassword(rl, '密码 (至少 8 位): ');
      if (password.length < 8) {
        console.log('✗ 密码长度不足 8 位，请重试');
        continue;
      }
      const confirm = await askPassword(rl, '确认密码: ');
      if (password !== confirm) {
        console.log('✗ 两次输入不一致，请重试');
        continue;
      }
      break;
    }

    // 用户名占用检查
    const existedAccount = await accountRepo.findOne({
      where: { provider: 'local', provider_user_id: username },
    });
    if (existedAccount) {
      console.error(`✗ 用户名 "${username}" 已存在，拒绝创建（脚本不会覆盖已有账号）`);
      rl.close();
      process.exit(1);
    }

    // 已有 admin 提示
    const superRole = await roleRepo.findOne({ where: { name: 'super_admin' } });
    const fallbackAdmin = await roleRepo.findOne({ where: { name: 'admin' } });
    const roleId = superRole?.id || fallbackAdmin?.id;
    if (!roleId) {
      console.error('✗ 角色未初始化。请先启动应用让 seedRoles() 建角色后再运行本脚本。');
      rl.close();
      process.exit(1);
    }
    const existingAdmin = await userRepo.findOne({ where: { role_id: roleId } });
    if (existingAdmin) {
      const cont = await ask(rl, '⚠ 已存在管理员账号，是否继续创建新管理员？(y/N): ');
      if (cont.toLowerCase() !== 'y') {
        console.log('已取消');
        rl.close();
        process.exit(0);
      }
    }

    rl.close();

    // 写入
    const user = userRepo.create({ username, email, role_id: roleId });
    const savedUser = await userRepo.save(user);

    const passwordHash = await bcrypt.hash(password, 10);
    await accountRepo.save(
      accountRepo.create({
        user_id: savedUser.id,
        provider: 'local',
        provider_user_id: username,
        password_hash: passwordHash,
      }),
    );

    console.log(`\n✓ 管理员创建成功（用户名: ${username}）`);
    console.log('  请访问 /admin/login 登录');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('创建失败:', err);
  process.exit(1);
});
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd server; npx tsc --noEmit src/scripts/create-admin.ts`
Expected: 无错误（若提示模块找不到，确认 `tsconfig.json` 包含 `src/**/*`）

- [ ] **Step 3: 手动运行验证（需本地 PG + Redis 已起）**

前置：`docker-compose up -d` 起依赖。
Run: `cd server; npm run create-admin`
交互输入：用户名 `admin` / 邮箱回车 / 密码 `test1234` / 确认 `test1234`
Expected: 输出 `✓ 管理员创建成功`，DB `accounts` 表新增一行 `password_hash` 以 `$2a$10$` 开头

- [ ] **Step 4: 验证可用此账号登录**

启动应用 `npm run start:dev`，POST `/api/auth/login` body `{"username":"admin","password":"test1234"}`
Expected: 返回 `{"token":"..."}`

- [ ] **Step 5: 验证幂等性**

再次 `npm run create-admin`，用户名填 `admin`
Expected: 输出 `✗ 用户名 "admin" 已存在`，exit code 1

- [ ] **Step 6: 验证密码长度校验**

`npm run create-admin`（用新用户名），密码输入 `123`
Expected: 输出 `✗ 密码长度不足 8 位，请重试`，循环重输

- [ ] **Step 7: Commit**

```bash
git add server/src/scripts/create-admin.ts
git commit -m "feat(scripts): 新增交互式 create-admin CLI 脚本"
```

---

### Task 4: 注册 `npm run create-admin` 脚本

**Files:**
- Modify: `c:\Users\sun\Desktop\学习产出\server\package.json` (scripts 段)

**Interfaces:**
- Produces: `npm run create-admin` 命令可用

- [ ] **Step 1: 修改 package.json**

在 [package.json:8-21](file:///c:/Users/sun/Desktop/学习产出/server/package.json#L8-L21) 的 `scripts` 对象里，`"test:e2e"` 之后追加一行：
```json
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "create-admin": "ts-node src/scripts/create-admin.ts"
```

- [ ] **Step 2: 验证脚本可调用**

Run: `cd server; npm run create-admin -- --help 2>&1 | Select-String "创建管理员"`
（脚本无 --help，但应进入交互提示并因 stdin 非 TTY 退出）
Expected: 输出包含 `=== 创建管理员账号 ===`

- [ ] **Step 3: Commit**

```bash
git add server/package.json
git commit -m "chore(scripts): 注册 npm run create-admin"
```

---

### Task 5: 更新部署文档

**Files:**
- Modify: `c:\Users\sun\Desktop\学习产出\Vercel部署指南.md`

**Interfaces:**
- Produces: 开源使用者知道首次部署后如何创建管理员

- [ ] **Step 1: 定位文档中提及 ADMIN_* 的位置**

Run: `grep -n "ADMIN_" "Vercel部署指南.md"`
记录所有提及处。

- [ ] **Step 2: 替换为 create-admin 指引**

把「配置 ADMIN_USERNAME/ADMIN_PASSWORD」相关段落替换为：

```markdown
## 首次部署：创建管理员

应用首次部署后（角色已由应用启动时自动初始化），**在本地** 运行脚本创建首个管理员：

> 注意：脚本需连接生产数据库。临时在 `server/.env` 填入生产 `DATABASE_*`
> 与 `REDIS_*`，跑完脚本后立即删除这些值。

\`\`\`bash
cd server
# 临时把 server/.env 的 DATABASE_* 指向 Vercel/Neon 的生产连接串
npm run create-admin
# 按提示输入用户名 / 邮箱 / 密码
# 完成后把 server/.env 改回本地值
\`\`\`

为什么要在本地跑？Vercel 是 serverless，没有常驻进程可执行交互式 CLI。
```

- [ ] **Step 3: Commit**

```bash
git add Vercel部署指南.md
git commit -m "docs: 更新 Vercel 部署指南，改用 create-admin 脚本"
```

---

## Self-Review

**Spec 覆盖**：
- 删除项 → Task 1 (env) + Task 2 (seed)
- 新增 create-admin.ts + package.json → Task 3 + Task 4
- 密码掩码 readline → Task 3 Step 1 含完整实现
- 校验规则（长度/一致/唯一/已有admin）→ Task 3 Step 1 全部覆盖
- 写入逻辑 → Task 3 Step 1 复用 seedInitialAdmin 原逻辑
- 幂等性 → Task 3 Step 5
- 部署流程变化 → Task 5 文档 + Global Constraints 写明 Vercel 约束
- 兼容性（已部署用户）→ Task 2 删 seedInitialAdmin 不影响 DB 已存数据
- 启动日志提示 → Task 2 Step 3 `warnIfNoAdmin`

**Placeholder 扫描**：无 TBD/TODO，所有步骤含完整代码或确切命令。

**类型一致**：实体字段 `provider_user_id`、`password_hash`、`role_id`、`user_id` 全程一致；角色名 `super_admin`/`admin` 一致。

**发现并修复**：spec 原文说「应用启动时 `seedRoles()` 末尾加提示」——但 `seedRoles()` 末尾不合适（此时角色刚建完，可能还有迁移没跑）。调整为独立方法 `warnIfNoAdmin()` 放在 `onApplicationBootstrap` 末尾更准确。plan 已采用此修正版。
