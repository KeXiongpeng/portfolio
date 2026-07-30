# JWT 账号密码 + GitHub 双登录认证 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为现有 GitHub OAuth 后台新增账号密码注册/登录（JWT），GitHub 降为第三方可选登录，并引入简化 RBAC 角色权限控制。

**Architecture:** 采用账户分离模型——`users` 表存基础信息，`accounts` 表存登录凭据（区分 local/github 两种 provider），`roles` 表做角色管理。后端新增注册/登录接口 + RolesGuard 权限守卫；前端重构登录页（账号密码优先）并新增注册页。

**Tech Stack:** NestJS + TypeORM + PostgreSQL + bcryptjs（密码哈希）+ JWT + Passport；Next.js App Router + React。

## Global Constraints

- 密码哈希使用 `bcryptjs`（纯 JS 实现，避免 Windows 原生编译问题），salt rounds = 10
- JWT payload 统一为 `{ sub, username, role }`，去掉旧的 `githubId`
- 所有 `/api/admin/*` 路由必须 admin 角色才能访问（通过 `@Roles('admin')` + 全局 RolesGuard）
- 新注册用户角色固定为 `user`，首个管理员通过环境变量 `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`ADMIN_EMAIL` 引导创建
- 保留 `ALLOWED_GITHUB_IDS` 白名单，白名单内 GitHub 用户自动 admin 角色
- 实体关系：`users.role_id` → `roles.id`，`accounts.user_id` → `users.id`，`(accounts.provider, accounts.provider_user_id)` 联合唯一

---

## File Structure

### 新建文件
- `server/src/entities/role.entity.ts` — 角色表实体
- `server/src/entities/account.entity.ts` — 登录凭据表实体
- `server/src/modules/auth/dto/register.dto.ts` — 注册请求 DTO
- `server/src/modules/auth/dto/login.dto.ts` — 登录请求 DTO
- `server/src/common/decorators/roles.decorator.ts` — @Roles() 角色装饰器
- `server/src/common/guards/roles.guard.ts` — 角色权限守卫
- `server/src/modules/auth/seed.service.ts` — 初始管理员引导 + 迁移
- `server/src/modules/auth/auth.service.spec.ts` — AuthService 单元测试
- `web/app/admin/register/page.tsx` — 注册页

### 修改文件
- `server/src/entities/user.entity.ts` — 移除 github_id，新增 role_id、email
- `server/src/entities/index.ts` — 导出 Role、Account
- `server/src/modules/auth/auth.service.ts` — 新增 register/login，重构 GitHub
- `server/src/modules/auth/auth.controller.ts` — 新增 register/login 路由
- `server/src/modules/auth/auth.module.ts` — 注册 SeedService、新实体
- `server/src/modules/auth/jwt.strategy.ts` — payload 去掉 githubId
- `server/src/modules/blog/blog.controller.ts` — admin 路由加 @Roles('admin')
- `server/src/modules/project/project.controller.ts` — admin 路由加 @Roles('admin')
- `server/src/modules/profile/profile.controller.ts` — admin 路由加 @Roles('admin')
- `server/src/modules/contact/contact.controller.ts` — admin 路由加 @Roles('admin')
- `server/src/modules/visit/visit.controller.ts` — admin 路由加 @Roles('admin')
- `server/src/modules/upload/upload.controller.ts` — 加 @Roles('admin')
- `server/src/app.module.ts` — 注册 RolesGuard 全局守卫
- `server/package.json` — 新增 bcryptjs、@types/bcryptjs 依赖
- `web/app/admin/login/page.tsx` — 重构为账号密码优先
- `web/lib/api.ts` — 新增 register/login 方法

---

## Task 1: Backend 数据层 — 实体与依赖

**Files:**
- Create: `server/src/entities/role.entity.ts`
- Create: `server/src/entities/account.entity.ts`
- Modify: `server/src/entities/user.entity.ts`
- Modify: `server/src/entities/index.ts`
- Modify: `server/package.json`

**Interfaces:**
- Produces: `Role` 实体（id, name, description, created_at），`Account` 实体（id, user_id, provider, provider_user_id, password_hash, created_at），更新后的 `User` 实体（id, username, email, avatar_url, role_id, created_at）

- [ ] **Step 1: 安装 bcryptjs 依赖**

Run:
```bash
cd server
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: 创建 Role 实体**

Create `server/src/entities/role.entity.ts`:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  name: string;

  @Column({ length: 200, nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;
}
```

- [ ] **Step 3: 创建 Account 实体**

Create `server/src/entities/account.entity.ts`:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('accounts')
@Unique(['provider', 'provider_user_id'])
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ length: 20 })
  provider: string;

  @Column({ length: 100 })
  provider_user_id: string;

  @Column({ length: 200, nullable: true })
  password_hash: string;

  @CreateDateColumn()
  created_at: Date;
}
```

- [ ] **Step 4: 修改 User 实体**

Replace the full contents of `server/src/entities/user.entity.ts`:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 200, nullable: true })
  email: string;

  @Column({ length: 500, nullable: true })
  avatar_url: string;

  @Column({ name: 'role_id', nullable: true })
  role_id: number;

  @CreateDateColumn()
  created_at: Date;
}
```

> 移除了原 `github_id` 列（迁入 accounts 表），新增 `email` 和 `role_id` 列。

- [ ] **Step 5: 更新实体索引导出**

Modify `server/src/entities/index.ts`, add Role and Account exports:
```typescript
export { User } from './user.entity';
export { Role } from './role.entity';
export { Account } from './account.entity';
export { Project } from './project.entity';
export { Blog } from './blog.entity';
export { Contact } from './contact.entity';
export { VisitStat } from './visit-stat.entity';
export { Profile } from './profile.entity';
```

- [ ] **Step 6: 提交**

```bash
git add server/src/entities/role.entity.ts server/src/entities/account.entity.ts server/src/entities/user.entity.ts server/src/entities/index.ts server/package.json server/package-lock.json
git commit -m "feat: 新增 Role/Account 实体，User 实体改用 role_id 外键"
```

---

## Task 2: Auth Service — 注册/登录逻辑 + GitHub 重构

**Files:**
- Create: `server/src/modules/auth/dto/register.dto.ts`
- Create: `server/src/modules/auth/dto/login.dto.ts`
- Create: `server/src/modules/auth/auth.service.spec.ts`
- Modify: `server/src/modules/auth/auth.service.ts`

**Interfaces:**
- Consumes: `Role`、`Account`、`User` 实体（来自 Task 1）
- Produces:
  - `AuthService.register(username, password, email): Promise<{ token: string }>`
  - `AuthService.validateLocalUser(username, password): Promise<User>`
  - 重构后的 `AuthService.validateGithubUser(githubId, username, avatarUrl): Promise<User | null>`
  - `AuthService.generateToken(user): Promise<string>` — payload 改为 `{ sub, username, role }`

- [ ] **Step 1: 创建 RegisterDto**

Create `server/src/modules/auth/dto/register.dto.ts`:
```typescript
import { IsString, MinLength, MaxLength, IsEmail, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
```

- [ ] **Step 2: 创建 LoginDto**

Create `server/src/modules/auth/dto/login.dto.ts`:
```typescript
import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
```

- [ ] **Step 3: 编写 AuthService 单元测试**

Create `server/src/modules/auth/auth.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, Role, Account } from '../../entities';
import { RedisService } from '../../redis';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let accountRepo: any;
  let roleRepo: any;
  let jwtService: any;
  let redisService: any;

  beforeEach(async () => {
    userRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    accountRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    roleRepo = { findOne: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('mock-token') };
    redisService = { set: jest.fn(), get: jest.fn(), del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Account), useValue: accountRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('应在用户名未占用时成功注册', async () => {
      accountRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue({ id: 1, name: 'user' });
      userRepo.create.mockReturnValue({ id: 1, username: 'newuser' });
      userRepo.save.mockResolvedValue({ id: 1, username: 'newuser', role_id: 1 });
      accountRepo.create.mockReturnValue({});
      accountRepo.save.mockResolvedValue({});

      const result = await service.register('newuser', 'password123', 'test@test.com');
      expect(result.token).toBe('mock-token');
      expect(userRepo.save).toHaveBeenCalled();
      expect(accountRepo.save).toHaveBeenCalled();
    });

    it('应在用户名已存在时抛出 ConflictException', async () => {
      accountRepo.findOne.mockResolvedValue({ id: 1 });
      await expect(service.register('existing', 'password123', 'test@test.com'))
        .rejects.toThrow('用户名已存在');
    });
  });

  describe('validateLocalUser', () => {
    it('应在密码正确时返回用户', async () => {
      const hash = await bcrypt.hash('password123', 10);
      accountRepo.findOne.mockResolvedValue({
        id: 1,
        provider: 'local',
        provider_user_id: 'testuser',
        password_hash: hash,
      });
      userRepo.findOne.mockResolvedValue({ id: 1, username: 'testuser', role_id: 1 });

      const user = await service.validateLocalUser('testuser', 'password123');
      expect(user).toBeTruthy();
      expect(user.username).toBe('testuser');
    });

    it('应在密码错误时抛出 UnauthorizedException', async () => {
      const hash = await bcrypt.hash('correct', 10);
      accountRepo.findOne.mockResolvedValue({
        id: 1,
        password_hash: hash,
      });
      await expect(service.validateLocalUser('testuser', 'wrongpassword'))
        .rejects.toThrow('用户名或密码错误');
    });
  });

  describe('generateToken', () => {
    it('应使用 sub/username/role 签发 JWT', async () => {
      const user = { id: 5, username: 'admin', role_id: 1 } as any;
      jest.spyOn(service, 'getRoleName').mockResolvedValue('admin');
      await service.generateToken(user);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 5,
        username: 'admin',
        role: 'admin',
      });
    });
  });
});
```

- [ ] **Step 4: 运行测试确认失败**

Run:
```bash
cd server
npx jest auth.service.spec.ts
```
Expected: FAIL（方法尚未实现）

- [ ] **Step 5: 重写 AuthService 实现**

Replace the full contents of `server/src/modules/auth/auth.service.ts`:
```typescript
// server/src/modules/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Role, Account } from '../../entities';
import { RedisService } from '../../redis';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  /** 账号密码注册 */
  async register(username: string, password: string, email: string): Promise<{ token: string }> {
    // 检查用户名是否已被 local 账号占用
    const existing = await this.accountRepo.findOne({
      where: { provider: 'local', provider_user_id: username },
    });
    if (existing) throw new ConflictException('用户名已存在');

    // 获取默认 user 角色
    const userRole = await this.roleRepo.findOne({ where: { name: 'user' } });
    if (!userRole) throw new Error('默认角色不存在，请先初始化角色数据');

    // 创建用户
    const user = this.userRepo.create({
      username,
      email,
      role_id: userRole.id,
    });
    const savedUser = await this.userRepo.save(user);

    // 创建 local 账号凭据
    const passwordHash = await bcrypt.hash(password, 10);
    const account = this.accountRepo.create({
      user_id: savedUser.id,
      provider: 'local',
      provider_user_id: username,
      password_hash: passwordHash,
    });
    await this.accountRepo.save(account);

    const token = await this.generateToken(savedUser);
    return { token };
  }

  /** 账号密码登录校验 */
  async validateLocalUser(username: string, password: string): Promise<User> {
    const account = await this.accountRepo.findOne({
      where: { provider: 'local', provider_user_id: username },
    });
    if (!account) throw new UnauthorizedException('用户名或密码错误');

    const isMatch = await bcrypt.compare(password, account.password_hash);
    if (!isMatch) throw new UnauthorizedException('用户名或密码错误');

    const user = await this.userRepo.findOne({ where: { id: account.user_id } });
    if (!user) throw new UnauthorizedException('用户不存在');
    return user;
  }

  /** GitHub 用户校验（白名单内自动 admin） */
  async validateGithubUser(githubId: number | string, username: string, avatarUrl: string): Promise<User | null> {
    const numericId = Number(githubId);
    const providerUserId = String(numericId);

    // 查找已有的 github 账号
    let account = await this.accountRepo.findOne({
      where: { provider: 'github', provider_user_id: providerUserId },
    });

    if (account) {
      // 已存在，更新头像和用户名
      const user = await this.userRepo.findOne({ where: { id: account.user_id } });
      if (user) {
        user.avatar_url = avatarUrl;
        user.username = username;
        await this.userRepo.save(user);
        return user;
      }
    }

    // 白名单检查
    const allowedIds = (process.env.ALLOWED_GITHUB_IDS || '').split(',').map(Number);
    const isWhitelisted = allowedIds.includes(numericId);

    // 确定角色
    let roleId: number;
    if (isWhitelisted) {
      const adminRole = await this.roleRepo.findOne({ where: { name: 'admin' } });
      roleId = adminRole?.id;
    } else {
      const userRole = await this.roleRepo.findOne({ where: { name: 'user' } });
      roleId = userRole?.id;
    }
    if (!roleId) throw new Error('角色数据未初始化');

    // 创建新用户 + github 账号
    const user = this.userRepo.create({
      username,
      avatar_url: avatarUrl,
      role_id: roleId,
    });
    const savedUser = await this.userRepo.save(user);

    account = this.accountRepo.create({
      user_id: savedUser.id,
      provider: 'github',
      provider_user_id: providerUserId,
    });
    await this.accountRepo.save(account);

    return savedUser;
  }

  /** 根据 role_id 查询角色名 */
  async getRoleName(roleId: number | null): Promise<string> {
    if (!roleId) return 'user';
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    return role?.name || 'user';
  }

  /** 签发 JWT */
  async generateToken(user: User): Promise<string> {
    const role = await this.getRoleName(user.role_id);
    const payload = { sub: user.id, username: user.username, role };
    return this.jwtService.sign(payload);
  }

  /** 刷新 token（从 DB 重新加载用户角色，避免角色丢失） */
  async refreshToken(userId: number): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    return this.generateToken(user);
  }

  async generateState(): Promise<string> {
    const state = Math.random().toString(36).substring(2, 15);
    await this.redisService.set(`oauth:state:${state}`, '1', 600);
    return state;
  }

  async validateState(state: string): Promise<boolean> {
    const value = await this.redisService.get(`oauth:state:${state}`);
    if (!value) return false;
    await this.redisService.del(`oauth:state:${state}`);
    return true;
  }
}
```

- [ ] **Step 6: 更新 AuthModule 注入新实体**

Modify `server/src/modules/auth/auth.module.ts`, update the TypeOrmModule.forFeature to include Account and Role:
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Account, Role } from '../../entities';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GithubStrategy } from './github.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, Role]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GithubStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 7: 运行测试确认通过**

Run:
```bash
cd server
npx jest auth.service.spec.ts
```
Expected: PASS（3 个测试用例全部通过）

- [ ] **Step 8: 提交**

```bash
git add server/src/modules/auth/dto/ server/src/modules/auth/auth.service.ts server/src/modules/auth/auth.service.spec.ts server/src/modules/auth/auth.module.ts
git commit -m "feat: AuthService 新增注册/登录逻辑，重构 GitHub 登录使用 accounts 表"
```

---

## Task 3: Auth 基础设施 — JWT 策略 + 角色守卫

**Files:**
- Create: `server/src/common/decorators/roles.decorator.ts`
- Create: `server/src/common/guards/roles.guard.ts`
- Modify: `server/src/modules/auth/jwt.strategy.ts`
- Modify: `server/src/app.module.ts`

**Interfaces:**
- Consumes: AuthService 产出的 JWT payload（来自 Task 2）
- Produces: `@Roles()` 装饰器、`RolesGuard` 全局守卫；更新后的 `JwtStrategy.validate` 返回 `{ id, username, role }`

- [ ] **Step 1: 创建 @Roles 装饰器**

Create `server/src/common/decorators/roles.decorator.ts`:
```typescript
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 2: 创建 RolesGuard**

Create `server/src/common/guards/roles.guard.ts`:
```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // 没有 @Roles() 装饰器的路由不做角色限制
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('权限不足，需要管理员角色');
    }
    return true;
  }
}
```

- [ ] **Step 3: 更新 JWT 策略 payload**

Replace `server/src/modules/auth/jwt.strategy.ts` validate method. Full file:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
          }
          return req?.cookies?.token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default-secret',
    });
  }

  async validate(payload: { sub: number; username: string; role: string }) {
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
```

- [ ] **Step 4: 注册 RolesGuard 为全局守卫**

Modify `server/src/app.module.ts`, add RolesGuard import and register it as second APP_GUARD. Update the providers array:
```typescript
import { JwtAuthGuard } from './common/guards/jwt.guard';
import { RolesGuard } from './common/guards/roles.guard';
// ... (其他 import 保持不变)

// providers 部分：
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
```

> JwtAuthGuard 先执行（验证 JWT 并填充 req.user），RolesGuard 后执行（检查角色）。NestJS 按注册顺序执行全局守卫。

- [ ] **Step 5: 提交**

```bash
git add server/src/common/decorators/roles.decorator.ts server/src/common/guards/roles.guard.ts server/src/modules/auth/jwt.strategy.ts server/src/app.module.ts
git commit -m "feat: 新增 RolesGuard 角色守卫，JWT payload 改用 role 字段"
```

---

## Task 4: 为所有 admin 路由添加 @Roles('admin')

**Files:**
- Modify: `server/src/modules/blog/blog.controller.ts`
- Modify: `server/src/modules/project/project.controller.ts`
- Modify: `server/src/modules/profile/profile.controller.ts`
- Modify: `server/src/modules/contact/contact.controller.ts`
- Modify: `server/src/modules/visit/visit.controller.ts`
- Modify: `server/src/modules/upload/upload.controller.ts`

**Interfaces:**
- Consumes: `@Roles()` 装饰器（来自 Task 3）

- [ ] **Step 1: blog.controller.ts 添加 @Roles('admin')**

在文件顶部 import 区添加：
```typescript
import { Roles } from '../../common/decorators/roles.decorator';
```
在每个 admin 方法（`getAllBlogs`、`createBlog`、`updateBlog`、`deleteBlog`、`publishBlog`、`unpublishBlog`）的 `@UseGuards(JwtAuthGuard)` 上方添加 `@Roles('admin')`。

示例（getAllBlogs）：
```typescript
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Get('admin/blogs')
  getAllBlogs() {
    return this.blogService.getAllBlogs();
  }
```

对全部 6 个 admin 方法做同样修改。

- [ ] **Step 2: project.controller.ts 添加 @Roles('admin')**

同样 import `Roles`，为 `getAllProjects`、`createProject`、`updateProject`、`deleteProject`、`reorderProjects` 添加 `@Roles('admin')`。

- [ ] **Step 3: profile.controller.ts 添加 @Roles('admin')**

Import `Roles`，为 `getAdminProfile`、`updateProfile` 添加 `@Roles('admin')`。

- [ ] **Step 4: contact.controller.ts 添加 @Roles('admin')**

Import `Roles`，为 `getContacts`、`markAsRead` 添加 `@Roles('admin')`。

- [ ] **Step 5: visit.controller.ts 添加 @Roles('admin')**

Import `Roles`，为 `getAnalytics` 添加 `@Roles('admin')`。

- [ ] **Step 6: upload.controller.ts 添加 @Roles('admin')**

Import `Roles`，在类级别 `@UseGuards(JwtAuthGuard)` 上方添加 `@Roles('admin')`：
```typescript
import { Roles } from '../../common/decorators/roles.decorator';

@Roles('admin')
@UseGuards(JwtAuthGuard)
@Controller('api/admin/upload')
```

- [ ] **Step 7: 验证编译通过**

Run:
```bash
cd server
npx tsc --noEmit
```
Expected: 无编译错误

- [ ] **Step 8: 提交**

```bash
git add server/src/modules/blog/blog.controller.ts server/src/modules/project/project.controller.ts server/src/modules/profile/profile.controller.ts server/src/modules/contact/contact.controller.ts server/src/modules/visit/visit.controller.ts server/src/modules/upload/upload.controller.ts
git commit -m "feat: 所有 admin 路由添加 @Roles('admin') 权限校验"
```

---

## Task 5: Auth Controller — 注册/登录路由

**Files:**
- Modify: `server/src/modules/auth/auth.controller.ts`

**Interfaces:**
- Consumes: `AuthService.register()`、`AuthService.validateLocalUser()`（来自 Task 2）
- Produces: `POST /api/auth/register`、`POST /api/auth/login` 接口

- [ ] **Step 1: 更新 AuthController**

Replace the full contents of `server/src/modules/auth/auth.controller.ts`:
```typescript
// server/src/modules/auth/auth.controller.ts
import { Controller, Get, Req, Res, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /** 账号密码注册 */
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const { token } = await this.authService.register(dto.username, dto.password, dto.email);
    this.setAuthCookie(res, token);
    res.json({ token });
  }

  /** 账号密码登录 */
  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const user = await this.authService.validateLocalUser(dto.username, dto.password);
    const token = await this.authService.generateToken(user);
    this.setAuthCookie(res, token);
    res.json({ token });
  }

  /** GitHub 登录入口 */
  @Public()
  @Get('github')
  async githubLogin(@Req() req: Request, @Res() res: Response) {
    const state = await this.authService.generateState();
    const githubAuthUrl =
      `https://github.com/login/oauth/authorize?` +
      `client_id=${process.env.GITHUB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GITHUB_CALLBACK_URL)}&` +
      `state=${state}`;
    res.redirect(githubAuthUrl);
  }

  /** GitHub 回调 */
  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const token = await this.authService.generateToken(user);
    this.setAuthCookie(res, token);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/api/auth/set-cookie?token=${encodeURIComponent(token)}&dest=${encodeURIComponent('/admin/dashboard')}`;
    res.redirect(redirectUrl);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const token = await this.authService.refreshToken(user.id);
    this.setAuthCookie(res, token);
    res.json({ message: 'Token refreshed' });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  }

  /** 统一设置 auth cookie */
  private setAuthCookie(res: Response, token: string) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
```

- [ ] **Step 2: 验证编译通过**

Run:
```bash
cd server
npx tsc --noEmit
```
Expected: 无编译错误

- [ ] **Step 3: 提交**

```bash
git add server/src/modules/auth/auth.controller.ts
git commit -m "feat: AuthController 新增 register/login 路由，统一 cookie 设置"
```

---

## Task 6: 初始数据引导 — 角色 + 管理员 + 迁移

**Files:**
- Create: `server/src/modules/auth/seed.service.ts`
- Modify: `server/src/modules/auth/auth.module.ts`

**Interfaces:**
- Consumes: `Role`、`User`、`Account` 实体；`AuthService.register()`
- Produces: 启动时自动初始化 3 个角色 + 初始管理员账号

- [ ] **Step 1: 创建 SeedService**

Create `server/src/modules/auth/seed.service.ts`:
```typescript
import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role, User, Account } from '../../entities';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Account) private accountRepo: Repository<Account>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedRoles();
    await this.migrateOldGithubUsers();
    await this.seedInitialAdmin();
  }

  /** 初始化默认角色 */
  private async seedRoles() {
    const defaults = [
      { name: 'user', description: '普通用户' },
      { name: 'admin', description: '管理员' },
      { name: 'super_admin', description: '超级管理员' },
    ];
    for (const r of defaults) {
      const exists = await this.roleRepo.findOne({ where: { name: r.name } });
      if (!exists) {
        await this.roleRepo.save(this.roleRepo.create(r));
        this.logger.log(`已创建角色: ${r.name}`);
      }
    }
  }

  /** 迁移旧 users 表中的 github_id 到 accounts 表 */
  private async migrateOldGithubUsers() {
    // 检查 users 表是否还有 github_id 列（旧结构）
    try {
      const rows: any[] = await this.userRepo.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'github_id'`,
      );
      if (rows.length === 0) return; // 已迁移，无此列

      this.logger.log('检测到旧 github_id 列，开始迁移...');
      const oldUsers: any[] = await this.userRepo.query(
        `SELECT id, github_id, username, avatar_url FROM users WHERE github_id IS NOT NULL`,
      );

      // 获取 admin 角色用于白名单用户
      const adminRole = await this.roleRepo.findOne({ where: { name: 'admin' } });

      for (const old of oldUsers) {
        const providerUserId = String(old.github_id);
        const existing = await this.accountRepo.findOne({
          where: { provider: 'github', provider_user_id: providerUserId },
        });
        if (!existing) {
          await this.accountRepo.save(
            this.accountRepo.create({
              user_id: old.id,
              provider: 'github',
              provider_user_id: providerUserId,
            }),
          );
          // 设置 role_id（白名单用户为 admin）
          const allowedIds = (process.env.ALLOWED_GITHUB_IDS || '').split(',').map(Number);
          const roleId = allowedIds.includes(Number(old.github_id)) ? adminRole?.id : null;
          await this.userRepo.update(old.id, { role_id: roleId } as any);
        }
      }

      // 删除旧的 github_id 列
      await this.userRepo.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "github_id"`);
      this.logger.log('迁移完成，已删除 github_id 列');
    } catch (err) {
      this.logger.warn(`迁移检查跳过: ${(err as Error).message}`);
    }
  }

  /** 初始管理员引导（仅首次） */
  private async seedInitialAdmin() {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@localhost';

    if (!adminUsername || !adminPassword) {
      this.logger.log('未配置 ADMIN_USERNAME/ADMIN_PASSWORD，跳过初始管理员创建');
      return;
    }

    // 检查是否已存在管理员
    const adminRole = await this.roleRepo.findOne({ where: { name: 'admin' } });
    if (!adminRole) return;
    const existingAdmin = await this.userRepo.findOne({ where: { role_id: adminRole.id } });
    if (existingAdmin) return;

    // 检查用户名是否已被占用
    const existingAccount = await this.accountRepo.findOne({
      where: { provider: 'local', provider_user_id: adminUsername },
    });
    if (existingAccount) {
      this.logger.warn(`用户名 ${adminUsername} 已存在，跳过管理员创建`);
      return;
    }

    // 使用 super_admin 角色
    const superRole = await this.roleRepo.findOne({ where: { name: 'super_admin' } });
    const roleId = superRole?.id || adminRole.id;

    const user = this.userRepo.create({
      username: adminUsername,
      email: adminEmail,
      role_id: roleId,
    });
    const savedUser = await this.userRepo.save(user);

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await this.accountRepo.save(
      this.accountRepo.create({
        user_id: savedUser.id,
        provider: 'local',
        provider_user_id: adminUsername,
        password_hash: passwordHash,
      }),
    );

    this.logger.log(`已创建初始管理员账号: ${adminUsername}`);
  }
}
```

- [ ] **Step 2: 在 AuthModule 注册 SeedService**

Modify `server/src/modules/auth/auth.module.ts`, add SeedService to providers and ensure Account/Role/User are in forFeature:
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Account, Role } from '../../entities';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GithubStrategy } from './github.strategy';
import { JwtStrategy } from './jwt.strategy';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, Role]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GithubStrategy, JwtStrategy, SeedService],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 3: 配置环境变量**

在项目根目录 `.env` 文件中添加（如果没有则创建对应配置）：
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
ADMIN_EMAIL=admin@example.com
```

- [ ] **Step 4: 提交**

```bash
git add server/src/modules/auth/seed.service.ts server/src/modules/auth/auth.module.ts
git commit -m "feat: 新增 SeedService 初始化角色和引导管理员，迁移旧 github_id 数据"
```

---

## Task 7: 前端 — 登录页重构 + 注册页 + API

**Files:**
- Create: `web/app/admin/register/page.tsx`
- Modify: `web/app/admin/login/page.tsx`
- Modify: `web/lib/api.ts`

**Interfaces:**
- Consumes: 后端 `POST /api/auth/register`、`POST /api/auth/login` 接口（来自 Task 5）
- Produces: 账号密码优先的登录页、注册页、前端 API 方法

- [ ] **Step 1: 更新 lib/api.ts 新增 register/login 方法**

在 `web/lib/api.ts` 的 `api` 对象中，在 `loginGithub` 之前添加：
```typescript
  register: (data: { username: string; email: string; password: string }) =>
    fetchApi<{ token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { username: string; password: string }) =>
    fetchApi<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
```

- [ ] **Step 2: 重构登录页（账号密码优先）**

Replace the full contents of `web/app/admin/login/page.tsx`:
```tsx
// web/app/admin/login/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

function LoginInner() {
  const search = useSearchParams();
  const router = useRouter();
  const redirect = search.get('redirect') || '/admin/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 若已登录则直接跳转
  useEffect(() => {
    api.admin.getProfile().then(() => router.replace(redirect)).catch(() => {});
  }, [redirect, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await api.login({ username, password });
      // 通过前端中转路由设置 cookie（复用现有机制）
      window.location.href = `/api/auth/set-cookie?token=${encodeURIComponent(token)}&dest=${encodeURIComponent(redirect)}`;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '登录失败，请重试');
      setLoading(false);
    }
  };

  const loginUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/github`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-xl font-bold mb-1 text-gray-900 text-center">管理后台</h1>
        <p className="text-gray-500 mb-6 text-center text-sm">登录你的账号</p>

        {/* 账号密码登录（主要入口） */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="输入用户名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="输入密码"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* 分割线 */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-gray-400 text-xs">或使用以下方式</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* GitHub 登录（次要选项） */}
        <a
          href={loginUrl}
          className="block w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-md font-medium transition-colors no-underline text-center"
        >
          使用 GitHub 登录
        </a>

        {/* 注册引导 */}
        <p className="text-center text-sm text-gray-500 mt-5">
          没有账号？{' '}
          <Link href="/admin/register" className="text-blue-600 hover:underline">
            去注册
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
```

- [ ] **Step 3: 创建注册页**

Create `web/app/admin/register/page.tsx`:
```tsx
// web/app/admin/register/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const { token } = await api.register({ username, email, password });
      // 注册成功后自动登录跳转
      window.location.href = `/api/auth/set-cookie?token=${encodeURIComponent(token)}&dest=${encodeURIComponent('/admin/dashboard')}`;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '注册失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-xl font-bold mb-1 text-gray-900 text-center">注册账号</h1>
        <p className="text-gray-500 mb-6 text-center text-sm">创建一个新账号</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="至少 3 个字符"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="至少 6 个字符"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="再次输入密码"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          已有账号？{' '}
          <Link href="/admin/login" className="text-blue-600 hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 验证前端编译**

Run:
```bash
cd web
npx tsc --noEmit
```
Expected: 无编译错误

- [ ] **Step 5: 提交**

```bash
git add web/app/admin/login/page.tsx web/app/admin/register/page.tsx web/lib/api.ts
git commit -m "feat: 登录页重构为账号密码优先，新增注册页和前端 API 方法"
```

---

## 最终验证清单

完成所有 Task 后，按以下步骤端到端验证：

1. **启动后端**：`cd server && npm run start:dev` — 观察日志确认角色创建、管理员引导、迁移执行
2. **验证注册**：`POST /api/auth/register` 创建新用户
3. **验证登录**：`POST /api/auth/login` 使用管理员账号登录
4. **验证权限**：用普通用户 token 访问 `/api/admin/blogs` 应返回 403
5. **验证 GitHub**：访问 `/admin/login` 点击 GitHub 登录仍可正常工作
6. **验证前端**：启动 `cd web && npm run dev`，访问 `/admin/login` 和 `/admin/register`
