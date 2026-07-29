# Portfolio 全栈网站实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个全栈个人作品集与博客网站，前台展示个人信息/项目/博客，后台提供内容管理和访客统计。

**Architecture:** Monorepo 结构，`web/` 为 Next.js App Router 前端（Vercel 部署），`server/` 为 NestJS 后端（Docker 部署）。前端通过 REST API 与后端通信，后端使用 PostgreSQL 持久化 + Redis 缓存。认证采用 GitHub OAuth2 + JWT（HttpOnly Cookie）。

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Ant Design 5, NestJS 10, TypeORM, PostgreSQL 16, Redis 7, Docker Compose, Passport (GitHub OAuth), jsonwebtoken

## Global Constraints

- 前端框架：Next.js 14+ App Router（非 Pages Router）
- 前台样式：Tailwind CSS，管理后台样式：Ant Design 5
- 后端框架：NestJS 10+，ORM：TypeORM
- 数据库：PostgreSQL 16，缓存：Redis 7
- 认证：GitHub OAuth2 + JWT（HttpOnly Cookie 存储）
- Node.js 18+ 运行时
- 仓库路径：`c:\Users\sun\Desktop\学习产出`
- 前端部署：Vercel；后端部署：Docker Compose
- 响应式断点：Tailwind 默认（sm/md/lg/xl），后台仅适配 md+
- SEO：每页 metadata、sitemap.ts、robots.ts
- 所有代码使用 TypeScript
- 管理后台不针对手机优化

---

## Phase 1: 项目脚手架与后端基础

### Task 1: 初始化 Monorepo 根目录

**Files:**
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: 创建根 .gitignore**

```gitignore
node_modules/
dist/
.next/
.env
.env.local
*.log
.DS_Store
uploads/
temp/
```

- [ ] **Step 2: 创建 .env.example**

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=portfolio
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_change_this
JWT_EXPIRES_IN=7d

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
ALLOWED_GITHUB_IDS=your_github_id

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 3: 初始化 Git 仓库并提交**

Run: `git init && git add .gitignore .env.example && git commit -m "chore: init monorepo root with gitignore and env template"`
Expected: 仓库初始化成功，1 commit

---

### Task 2: 初始化 Next.js 前端项目

**Files:**
- Create: `web/` (Next.js 项目目录)

**Interfaces:**
- Produces: `web/` 可运行的 Next.js 14 App Router 项目

- [ ] **Step 1: 使用 create-next-app 初始化前端项目**

Run:
```powershell
npx create-next-app@14 web --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-turbo
```

在提示中选择：
- Yes to `Would you like to use Tailwind CSS?`
- No to `Would you like to use `src/` directory?`

- [ ] **Step 2: 安装额外前端依赖**

Run:
```powershell
cd web ; npm install antd @ant-design/icons @ant-design/nextjs-registry react-markdown remark-gfm rehype-highlight rehype-slug rehype-autolink-headings
```

- [ ] **Step 3: 验证项目可运行**

Run: `cd web ; npm run dev`
Expected: Next.js dev server 在 http://localhost:3000 启动成功

- [ ] **Step 4: 提交**

Run: `git add web/ && git commit -m "chore: init Next.js 14 app with Tailwind CSS and Ant Design"`

---

### Task 3: 初始化 NestJS 后端项目

**Files:**
- Create: `server/` (NestJS 项目目录)

**Interfaces:**
- Produces: `server/` 可运行的 NestJS 10 项目

- [ ] **Step 1: 使用 NestJS CLI 初始化后端项目**

Run:
```powershell
npx @nestjs/cli@10 new server --package-manager npm --skip-git
```

- [ ] **Step 2: 安装后端依赖**

Run:
```powershell
cd server ; npm install @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-github2 passport-jwt @nestjs/serve-static multer ioredis cookie-parser @nestjs/mapped-types
```

- [ ] **Step 3: 安装开发依赖**

Run:
```powershell
cd server ; npm install -D @types/passport-github2 @types/passport-jwt @types/cookie-parser @types/multer
```

- [ ] **Step 4: 修改 server/src/main.ts 监听 3001 端口并启用 CORS 和 Cookie**

```typescript
// server/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  await app.listen(3001);
  console.log('Server running on http://localhost:3001');
}
bootstrap();
```

- [ ] **Step 5: 验证后端可运行**

Run: `cd server ; npm run start:dev`
Expected: NestJS 在 http://localhost:3001 启动成功

- [ ] **Step 6: 提交**

Run: `git add server/ && git commit -m "chore: init NestJS 10 backend with TypeORM, JWT, Passport, Redis"`

---

### Task 4: 创建 Docker Compose 编排文件

**Files:**
- Create: `docker-compose.yml`

**Interfaces:**
- Consumes: `server/Dockerfile`（Task 5 创建）

- [ ] **Step 1: 创建 server/Dockerfile**

```dockerfile
# server/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

- [ ] **Step 2: 创建 server/.dockerignore**

```
node_modules
dist
*.log
.env
```

- [ ] **Step 3: 创建根目录 docker-compose.yml**

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-portfolio}
      POSTGRES_USER: ${DATABASE_USER:-postgres}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-postgres}
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  server:
    build: ./server
    ports:
      - '3001:3001'
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads

volumes:
  pgdata:
```

- [ ] **Step 4: 验证 Docker Compose 配置**

Run: `docker-compose config`
Expected: 配置解析成功，无报错

- [ ] **Step 5: 提交**

Run: `git add docker-compose.yml server/Dockerfile server/.dockerignore && git commit -m "chore: add Docker Compose for PostgreSQL, Redis, and NestJS server"`

---

### Task 5: 创建 TypeORM 实体与数据库模块

**Files:**
- Create: `server/src/entities/user.entity.ts`
- Create: `server/src/entities/project.entity.ts`
- Create: `server/src/entities/blog.entity.ts`
- Create: `server/src/entities/contact.entity.ts`
- Create: `server/src/entities/visit-stat.entity.ts`
- Create: `server/src/entities/index.ts`
- Modify: `server/src/app.module.ts`

**Interfaces:**
- Produces: 所有实体类，供后续模块使用

- [ ] **Step 1: 创建 User 实体**

```typescript
// server/src/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  github_id: number;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 500, nullable: true })
  avatar_url: string;

  @Column({ length: 20, default: 'admin' })
  role: string;

  @CreateDateColumn()
  created_at: Date;
}
```

- [ ] **Step 2: 创建 Project 实体**

```typescript
// server/src/entities/project.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 200, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ length: 500, nullable: true })
  cover_url: string;

  @Column('text', { array: true, default: [] })
  tech_stack: string[];

  @Column({ length: 500, nullable: true })
  demo_url: string;

  @Column({ length: 500, nullable: true })
  github_url: string;

  @Column({ default: 0 })
  sort_order: number;

  @Column({ default: true })
  is_visible: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

- [ ] **Step 3: 创建 Blog 实体**

```typescript
// server/src/entities/blog.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 200, unique: true })
  slug: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 500, nullable: true })
  summary: string;

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column({ length: 20, default: 'draft' })
  status: 'draft' | 'published';

  @Column({ default: 0 })
  view_count: number;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

- [ ] **Step 4: 创建 Contact 实体**

```typescript
// server/src/entities/contact.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 200 })
  email: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  is_read: boolean;

  @CreateDateColumn()
  created_at: Date;
}
```

- [ ] **Step 5: 创建 VisitStat 实体**

```typescript
// server/src/entities/visit-stat.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('visit_stats')
export class VisitStat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', unique: true })
  date: string;

  @Column({ default: 0 })
  pv: number;

  @Column({ default: 0 })
  uv: number;

  @CreateDateColumn()
  created_at: Date;
}
```

- [ ] **Step 6: 创建实体导出索引**

```typescript
// server/src/entities/index.ts
export { User } from './user.entity';
export { Project } from './project.entity';
export { Blog } from './blog.entity';
export { Contact } from './contact.entity';
export { VisitStat } from './visit-stat.entity';
```

- [ ] **Step 7: 配置 app.module.ts 连接 PostgreSQL 和 Redis**

```typescript
// server/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as entities from './entities';

const entityList = Object.values(entities);

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'portfolio',
        entities: entityList,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
})
export class AppModule {}
```

- [ ] **Step 8: 创建 Redis 模块**

```typescript
// server/src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

```typescript
// server/src/redis/redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  onModuleDestroy() {
    this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async scard(key: string): Promise<number> {
    return this.client.scard(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({ match: pattern, count: 100 });
    const keys: string[] = [];
    stream.on('data', (resultKeys: string[]) => keys.push(...resultKeys));
    await new Promise<void>((resolve) => stream.on('end', () => resolve()));
    if (keys.length > 0) await this.client.del(...keys);
  }
}
```

```typescript
// server/src/redis/index.ts
export { RedisModule } from './redis.module';
export { RedisService } from './redis.service';
```

- [ ] **Step 9: 将 RedisModule 加入 AppModule**

在 `server/src/app.module.ts` 的 imports 数组中添加 `RedisModule`（从 `./redis` 导入）。

- [ ] **Step 10: 启动 PostgreSQL 和 Redis，验证数据库连接和表自动创建**

Run: `docker-compose up -d postgres redis`
Run: `cd server ; cp ../.env.example ../.env ; npm run start:dev`
Expected: NestJS 启动成功，PostgreSQL 中自动创建 5 张表

- [ ] **Step 11: 提交**

Run: `git add server/src/entities/ server/src/redis/ server/src/app.module.ts && git commit -m "feat: add TypeORM entities and Redis module"`

---

## Phase 2: 认证系统

### Task 6: GitHub OAuth2 登录与 JWT 签发

**Files:**
- Create: `server/src/modules/auth/auth.module.ts`
- Create: `server/src/modules/auth/auth.controller.ts`
- Create: `server/src/modules/auth/auth.service.ts`
- Create: `server/src/modules/auth/github.strategy.ts`
- Create: `server/src/modules/auth/jwt.strategy.ts`
- Modify: `server/src/app.module.ts`

**Interfaces:**
- Consumes: `RedisService`（Task 5）
- Consumes: `User` 实体（Task 5）
- Produces: `GET /api/auth/github` — 发起 GitHub OAuth
- Produces: `GET /api/auth/github/callback` — OAuth 回调，签发 JWT Cookie
- Produces: `POST /api/admin/auth/refresh` — 刷新 JWT
- Produces: `POST /api/admin/auth/logout` — 清除 Cookie

- [ ] **Step 1: 创建 Auth Service**

```typescript
// server/src/modules/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities';
import { RedisService } from '../../redis';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async validateGithubUser(githubId: number, username: string, avatarUrl: string): Promise<User | null> {
    const allowedIds = (process.env.ALLOWED_GITHUB_IDS || '').split(',').map(Number);
    if (!allowedIds.includes(githubId)) return null;

    let user = await this.userRepo.findOne({ where: { github_id: githubId } });
    if (!user) {
      user = this.userRepo.create({ github_id: githubId, username, avatar_url: avatarUrl });
      user = await this.userRepo.save(user);
    } else {
      user.avatar_url = avatarUrl;
      user.username = username;
      user = await this.userRepo.save(user);
    }
    return user;
  }

  async generateToken(user: User): Promise<string> {
    const payload = { sub: user.id, githubId: user.github_id, username: user.username, role: user.role };
    return this.jwtService.sign(payload);
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

- [ ] **Step 2: 创建 GitHub Strategy**

```typescript
// server/src/modules/auth/github.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from './auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
      passReqToCallback: true,
    });
  }

  async validate(req: any, accessToken: string, refreshToken: string, profile: any) {
    const state = req.query.state as string;
    const isValid = await this.authService.validateState(state);
    if (!isValid) throw new UnauthorizedException('Invalid OAuth state');

    const { id, username, avatar_url } = profile;
    const user = await this.authService.validateGithubUser(id, username, avatar_url);
    if (!user) throw new UnauthorizedException('You are not authorized to access the admin panel');
    return user;
  }
}
```

- [ ] **Step 3: 创建 JWT Strategy**

```typescript
// server/src/modules/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.token || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default-secret',
    });
  }

  async validate(payload: { sub: number; githubId: number; username: string; role: string }) {
    return { id: payload.sub, githubId: payload.githubId, username: payload.username, role: payload.role };
  }
}
```

- [ ] **Step 4: 创建 Auth Controller**

```typescript
// server/src/modules/auth/auth.controller.ts
import { Controller, Get, Req, Res, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const token = await this.authService.generateToken(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${frontendUrl}/admin/dashboard`);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const token = await this.authService.generateToken({ id: user.id, github_id: user.githubId, username: user.username, role: user.role } as any);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ message: 'Token refreshed' });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  }
}
```

- [ ] **Step 5: 创建 JWT Guard**

```typescript
// server/src/common/guards/jwt.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

- [ ] **Step 6: 创建 Public 装饰器**

```typescript
// server/src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 7: 创建 CurrentUser 装饰器**

```typescript
// server/src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  return data ? user?.[data] : user;
});
```

- [ ] **Step 8: 创建 Auth Module 并注册到 AppModule**

```typescript
// server/src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GithubStrategy } from './github.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GithubStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

在 `server/src/app.module.ts` 的 imports 中添加 `AuthModule`，并设置全局 JWT Guard：

```typescript
// server/src/app.module.ts — 更新后
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import * as entities from './entities';
import { RedisModule } from './redis';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt.guard';

const entityList = Object.values(entities);

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'portfolio',
        entities: entityList,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    RedisModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 9: 创建 modules 导出索引**

```typescript
// server/src/modules/index.ts
export { AuthModule } from './auth/auth.module';
```

- [ ] **Step 10: 提交**

Run: `git add server/src/modules/auth/ server/src/common/ server/src/modules/index.ts server/src/app.module.ts && git commit -m "feat: add GitHub OAuth2 login and JWT authentication"`

---

### Task 7: 全局异常过滤器

**Files:**
- Create: `server/src/common/filters/all-exceptions.filter.ts`
- Modify: `server/src/main.ts`

- [ ] **Step 1: 创建全局异常过滤器**

```typescript
// server/src/common/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const errorMessage = typeof message === 'string' ? message : (message as any).message || 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage,
    });
  }
}
```

- [ ] **Step 2: 在 main.ts 中注册过滤器**

在 `server/src/main.ts` 的 `bootstrap()` 函数中，`app.listen` 之前添加：
```typescript
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
// ...
app.useGlobalFilters(new AllExceptionsFilter());
```

- [ ] **Step 3: 提交**

Run: `git add server/src/common/filters/ server/src/main.ts && git commit -m "feat: add global exception filter"`

---

## Phase 3: 后端业务模块

### Task 8: Profile 模块 — 个人信息管理

**Files:**
- Create: `server/src/entities/profile.entity.ts`
- Modify: `server/src/entities/index.ts`
- Create: `server/src/modules/profile/profile.module.ts`
- Create: `server/src/modules/profile/profile.controller.ts`
- Create: `server/src/modules/profile/profile.service.ts`
- Create: `server/src/modules/profile/dto/update-profile.dto.ts`
- Modify: `server/src/modules/index.ts`
- Modify: `server/src/app.module.ts`

**Interfaces:**
- Consumes: `RedisService`（缓存）
- Produces: `GET /api/profile` — 获取公开个人信息
- Produces: `GET /api/admin/profile` — 获取完整个人信息
- Produces: `PUT /api/admin/profile` — 更新个人信息

- [ ] **Step 1: 创建 Profile 实体**

```typescript
// server/src/entities/profile.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 500, nullable: true })
  bio: string;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column({ length: 500, nullable: true })
  avatar_url: string;

  @Column({ type: 'jsonb', default: '{}' })
  social_links: {
    github?: string;
    linkedin?: string;
    email?: string;
    twitter?: string;
  };

  @Column({ type: 'jsonb', default: '[]' })
  skills: { name: string; category: string }[];

  @Column({ type: 'jsonb', default: '[]' })
  experience: { company: string; role: string; period: string; description: string }[];

  @Column({ type: 'jsonb', default: '[]' })
  education: { school: string; degree: string; period: string; description: string }[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

在 `server/src/entities/index.ts` 中添加 `export { Profile } from './profile.entity';`

- [ ] **Step 2: 创建 UpdateProfile DTO**

```typescript
// server/src/modules/profile/dto/update-profile.dto.ts
import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  about?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsObject()
  @IsOptional()
  social_links?: { github?: string; linkedin?: string; email?: string; twitter?: string };

  @IsArray()
  @IsOptional()
  skills?: { name: string; category: string }[];

  @IsArray()
  @IsOptional()
  experience?: { company: string; role: string; period: string; description: string }[];

  @IsArray()
  @IsOptional()
  education?: { school: string; degree: string; period: string; description: string }[];
}
```

- [ ] **Step 3: 创建 Profile Service**

```typescript
// server/src/modules/profile/profile.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../../entities';
import { RedisService } from '../../redis';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepo: Repository<Profile>,
    private redisService: RedisService,
  ) {}

  async getPublicProfile() {
    const cached = await this.redisService.get('cache:profile');
    if (cached) return JSON.parse(cached);

    let profile = await this.profileRepo.findOne({ where: { id: 1 } });
    if (!profile) {
      profile = this.profileRepo.create({
        name: 'Your Name',
        title: 'Full-Stack Developer',
        bio: 'A passionate developer',
      });
      profile = await this.profileRepo.save(profile);
    }
    await this.redisService.set('cache:profile', JSON.stringify(profile), 600);
    return profile;
  }

  async getAdminProfile() {
    return this.getPublicProfile();
  }

  async updateProfile(dto: UpdateProfileDto) {
    let profile = await this.profileRepo.findOne({ where: { id: 1 } });
    if (!profile) {
      profile = this.profileRepo.create(dto as any);
    } else {
      Object.assign(profile, dto);
    }
    profile = await this.profileRepo.save(profile);
    await this.redisService.del('cache:profile');
    return profile;
  }
}
```

- [ ] **Step 4: 创建 Profile Controller**

```typescript
// server/src/modules/profile/profile.controller.ts
import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Public()
  @Get('profile')
  getProfile() {
    return this.profileService.getPublicProfile();
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/profile')
  getAdminProfile() {
    return this.profileService.getAdminProfile();
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/profile')
  updateProfile(@Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(dto);
  }
}
```

- [ ] **Step 5: 创建 Profile Module 并注册**

```typescript
// server/src/modules/profile/profile.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../../entities';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Profile])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
```

在 `server/src/modules/index.ts` 添加 `export { ProfileModule } from './profile/profile.module';`
在 `server/src/app.module.ts` 的 imports 添加 `ProfileModule`

- [ ] **Step 6: 安装 class-validator 并验证**

Run: `cd server ; npm install class-validator class-transformer`
Run: `cd server ; npm run start:dev`
Expected: 启动成功，`GET http://localhost:3001/api/profile` 返回默认 profile

- [ ] **Step 7: 提交**

Run: `git add server/src/entities/profile.entity.ts server/src/entities/index.ts server/src/modules/profile/ server/src/modules/index.ts server/src/app.module.ts && git commit -m "feat: add profile module with caching"`

---

### Task 9: Project 模块 — 项目 CRUD

**Files:**
- Create: `server/src/modules/project/project.module.ts`
- Create: `server/src/modules/project/project.controller.ts`
- Create: `server/src/modules/project/project.service.ts`
- Create: `server/src/modules/project/dto/create-project.dto.ts`
- Create: `server/src/modules/project/dto/update-project.dto.ts`
- Create: `server/src/modules/project/dto/reorder-projects.dto.ts`
- Modify: `server/src/modules/index.ts`
- Modify: `server/src/app.module.ts`

**Interfaces:**
- Consumes: `RedisService`
- Consumes: `Project` 实体（Task 5）
- Produces: `GET /api/projects` — 公开项目列表（仅 visible）
- Produces: `GET /api/projects/:slug` — 单个项目详情
- Produces: `GET /api/admin/projects` — 所有项目
- Produces: `POST /api/admin/projects` — 创建项目
- Produces: `PUT /api/admin/projects/:id` — 更新项目
- Produces: `DELETE /api/admin/projects/:id` — 删除项目
- Produces: `PUT /api/admin/projects/reorder` — 批量排序

- [ ] **Step 1: 创建 DTOs**

```typescript
// server/src/modules/project/dto/create-project.dto.ts
import { IsString, IsOptional, IsArray, IsUrl, IsNumber, IsBoolean } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  cover_url?: string;

  @IsArray()
  @IsOptional()
  tech_stack?: string[];

  @IsString()
  @IsOptional()
  @IsUrl({}, { each: false })
  demo_url?: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { each: false })
  github_url?: string;

  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @IsBoolean()
  @IsOptional()
  is_visible?: boolean;
}
```

```typescript
// server/src/modules/project/dto/update-project.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
```

```typescript
// server/src/modules/project/dto/reorder-projects.dto.ts
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ReorderItem {
  @IsNumber()
  id: number;

  @IsNumber()
  sort_order: number;
}

export class ReorderProjectsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items: ReorderItem[];
}
```

- [ ] **Step 2: 创建 Project Service**

```typescript
// server/src/modules/project/project.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities';
import { RedisService } from '../../redis';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ReorderProjectsDto } from './dto/reorder-projects.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    private redisService: RedisService,
  ) {}

  private async clearCache() {
    await this.redisService.delPattern('cache:project:*');
  }

  async getPublicProjects(tag?: string) {
    const cacheKey = `cache:project:list:${tag || 'all'}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const query = this.projectRepo.createQueryBuilder('project')
      .where({ is_visible: true })
      .orderBy('sort_order', 'ASC');

    if (tag) {
      query.andWhere(':tag = ANY(project.tech_stack)', { tag });
    }

    const projects = await query.getMany();
    await this.redisService.set(cacheKey, JSON.stringify(projects), 600);
    return projects;
  }

  async getPublicProject(slug: string) {
    return this.projectRepo.findOne({ where: { slug, is_visible: true } });
  }

  async getAllProjects() {
    return this.projectRepo.find({ order: { sort_order: 'ASC' } });
  }

  async createProject(dto: CreateProjectDto) {
    const project = this.projectRepo.create(dto);
    const saved = await this.projectRepo.save(project);
    await this.clearCache();
    return saved;
  }

  async updateProject(id: number, dto: UpdateProjectDto) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    Object.assign(project, dto);
    const saved = await this.projectRepo.save(project);
    await this.clearCache();
    return saved;
  }

  async deleteProject(id: number) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    await this.projectRepo.remove(project);
    await this.clearCache();
  }

  async reorderProjects(dto: ReorderProjectsDto) {
    for (const item of dto.items) {
      await this.projectRepo.update(item.id, { sort_order: item.sort_order });
    }
    await this.clearCache();
    return { success: true };
  }
}
```

- [ ] **Step 3: 创建 Project Controller**

```typescript
// server/src/modules/project/project.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ReorderProjectsDto } from './dto/reorder-projects.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Public()
  @Get('projects')
  getProjects(@Query('tag') tag?: string) {
    return this.projectService.getPublicProjects(tag);
  }

  @Public()
  @Get('projects/:slug')
  getProject(@Param('slug') slug: string) {
    return this.projectService.getPublicProject(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/projects')
  getAllProjects() {
    return this.projectService.getAllProjects();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/projects')
  createProject(@Body() dto: CreateProjectDto) {
    return this.projectService.createProject(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/projects/:id')
  updateProject(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.projectService.updateProject(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/projects/:id')
  deleteProject(@Param('id', ParseIntPipe) id: number) {
    return this.projectService.deleteProject(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/projects/reorder')
  reorderProjects(@Body() dto: ReorderProjectsDto) {
    return this.projectService.reorderProjects(dto);
  }
}
```

- [ ] **Step 4: 创建 Project Module 并注册**

```typescript
// server/src/modules/project/project.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../../entities';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
```

在 `server/src/modules/index.ts` 添加 `export { ProjectModule } from './project/project.module';`
在 `server/src/app.module.ts` 的 imports 添加 `ProjectModule`

- [ ] **Step 5: 提交**

Run: `git add server/src/modules/project/ server/src/modules/index.ts server/src/app.module.ts && git commit -m "feat: add project CRUD module with caching"`

---

### Task 10: Blog 模块 — 博客 CRUD 与发布管理

**Files:**
- Create: `server/src/modules/blog/blog.module.ts`
- Create: `server/src/modules/blog/blog.controller.ts`
- Create: `server/src/modules/blog/blog.service.ts`
- Create: `server/src/modules/blog/dto/create-blog.dto.ts`
- Create: `server/src/modules/blog/dto/update-blog.dto.ts`
- Modify: `server/src/modules/index.ts`
- Modify: `server/src/app.module.ts`

**Interfaces:**
- Consumes: `RedisService`
- Consumes: `Blog` 实体（Task 5）
- Produces: `GET /api/blogs` — 公开博客列表（分页，tag 筛选）
- Produces: `GET /api/blogs/:slug` — 单篇博客详情（view_count+1）
- Produces: `GET /api/admin/blogs` — 所有博客（含草稿）
- Produces: `POST /api/admin/blogs` — 创建博客
- Produces: `PUT /api/admin/blogs/:id` — 更新博客
- Produces: `DELETE /api/admin/blogs/:id` — 删除博客
- Produces: `PATCH /api/admin/blogs/:id/publish` — 发布
- Produces: `PATCH /api/admin/blogs/:id/unpublish` — 下线

- [ ] **Step 1: 创建 DTOs**

```typescript
// server/src/modules/blog/dto/create-blog.dto.ts
import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
```

```typescript
// server/src/modules/blog/dto/update-blog.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateBlogDto } from './create-blog.dto';

export class UpdateBlogDto extends PartialType(CreateBlogDto) {
  status?: 'draft' | 'published';
}
```

- [ ] **Step 2: 创建 Blog Service**

```typescript
// server/src/modules/blog/blog.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from '../../entities';
import { RedisService } from '../../redis';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private blogRepo: Repository<Blog>,
    private redisService: RedisService,
  ) {}

  private async clearListCache() {
    await this.redisService.delPattern('cache:blog:list:*');
  }

  async getPublicBlogs(page = 1, limit = 10, tag?: string) {
    const cacheKey = `cache:blog:list:page=${page}&limit=${limit}&tag=${tag || 'all'}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const query = this.blogRepo.createQueryBuilder('blog')
      .where({ status: 'published' })
      .orderBy('published_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (tag) {
      query.andWhere(':tag = ANY(blog.tags)', { tag });
    }

    const [items, total] = await query.getManyAndCount();
    const result = { items, total, page, totalPages: Math.ceil(total / limit) };
    await this.redisService.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  async getPublicBlog(slug: string) {
    const blog = await this.blogRepo.findOne({ where: { slug, status: 'published' } });
    if (!blog) throw new NotFoundException('Blog not found');
    blog.view_count += 1;
    await this.blogRepo.save(blog);
    return blog;
  }

  async getAllBlogs() {
    return this.blogRepo.find({ order: { created_at: 'DESC' } });
  }

  async createBlog(dto: CreateBlogDto) {
    const blog = this.blogRepo.create(dto);
    return this.blogRepo.save(blog);
  }

  async updateBlog(id: number, dto: UpdateBlogDto) {
    const blog = await this.blogRepo.findOne({ where: { id } });
    if (!blog) throw new NotFoundException('Blog not found');
    Object.assign(blog, dto);
    return this.blogRepo.save(blog);
  }

  async deleteBlog(id: number) {
    const blog = await this.blogRepo.findOne({ where: { id } });
    if (!blog) throw new NotFoundException('Blog not found');
    await this.blogRepo.remove(blog);
    await this.clearListCache();
  }

  async publishBlog(id: number) {
    const blog = await this.blogRepo.findOne({ where: { id } });
    if (!blog) throw new NotFoundException('Blog not found');
    blog.status = 'published';
    blog.published_at = new Date();
    const saved = await this.blogRepo.save(blog);
    await this.clearListCache();
    return saved;
  }

  async unpublishBlog(id: number) {
    const blog = await this.blogRepo.findOne({ where: { id } });
    if (!blog) throw new NotFoundException('Blog not found');
    blog.status = 'draft';
    const saved = await this.blogRepo.save(blog);
    await this.clearListCache();
    return saved;
  }
}
```

- [ ] **Step 3: 创建 Blog Controller**

```typescript
// server/src/modules/blog/blog.controller.ts
import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api')
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Public()
  @Get('blogs')
  getBlogs(@Query('page') page?: string, @Query('limit') limit?: string, @Query('tag') tag?: string) {
    return this.blogService.getPublicBlogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      tag,
    );
  }

  @Public()
  @Get('blogs/:slug')
  getBlog(@Param('slug') slug: string) {
    return this.blogService.getPublicBlog(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/blogs')
  getAllBlogs() {
    return this.blogService.getAllBlogs();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/blogs')
  createBlog(@Body() dto: CreateBlogDto) {
    return this.blogService.createBlog(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/blogs/:id')
  updateBlog(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBlogDto) {
    return this.blogService.updateBlog(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/blogs/:id')
  deleteBlog(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.deleteBlog(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/blogs/:id/publish')
  publishBlog(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.publishBlog(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/blogs/:id/unpublish')
  unpublishBlog(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.unpublishBlog(id);
  }
}
```

- [ ] **Step 4: 创建 Blog Module 并注册**

```typescript
// server/src/modules/blog/blog.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from '../../entities';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Blog])],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
```

在 `server/src/modules/index.ts` 添加 `export { BlogModule } from './blog/blog.module';`
在 `server/src/app.module.ts` 的 imports 添加 `BlogModule`

- [ ] **Step 5: 提交**

Run: `git add server/src/modules/blog/ server/src/modules/index.ts server/src/app.module.ts && git commit -m "feat: add blog CRUD module with publish/unpublish"`

---

### Task 11: Contact 模块 — 联系表单

**Files:**
- Create: `server/src/modules/contact/contact.module.ts`
- Create: `server/src/modules/contact/contact.controller.ts`
- Create: `server/src/modules/contact/contact.service.ts`
- Create: `server/src/modules/contact/dto/create-contact.dto.ts`
- Modify: `server/src/modules/index.ts`
- Modify: `server/src/app.module.ts`

**Interfaces:**
- Produces: `POST /api/contact` — 提交联系表单
- Produces: `GET /api/admin/contacts` — 获取所有联系消息
- Produces: `PATCH /api/admin/contacts/:id/read` — 标记已读

- [ ] **Step 1: 创建 DTO**

```typescript
// server/src/modules/contact/dto/create-contact.dto.ts
import { IsString, IsEmail } from 'class-validator';

export class CreateContactDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  message: string;
}
```

- [ ] **Step 2: 创建 Contact Service**

```typescript
// server/src/modules/contact/contact.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../entities';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
  ) {}

  async createContact(dto: CreateContactDto) {
    const contact = this.contactRepo.create(dto);
    return this.contactRepo.save(contact);
  }

  async getAllContacts() {
    return this.contactRepo.find({ order: { created_at: 'DESC' } });
  }

  async markAsRead(id: number) {
    await this.contactRepo.update(id, { is_read: true });
    return this.contactRepo.findOne({ where: { id } });
  }
}
```

- [ ] **Step 3: 创建 Contact Controller**

```typescript
// server/src/modules/contact/contact.controller.ts
import { Controller, Get, Post, Patch, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api')
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Public()
  @Post('contact')
  createContact(@Body() dto: CreateContactDto) {
    return this.contactService.createContact(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/contacts')
  getContacts() {
    return this.contactService.getAllContacts();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/contacts/:id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.contactService.markAsRead(id);
  }
}
```

- [ ] **Step 4: 创建 Contact Module 并注册**

```typescript
// server/src/modules/contact/contact.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../../entities';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Contact])],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
```

在 `server/src/modules/index.ts` 添加 `export { ContactModule } from './contact/contact.module';`
在 `server/src/app.module.ts` 的 imports 添加 `ContactModule`

- [ ] **Step 5: 提交**

Run: `git add server/src/modules/contact/ server/src/modules/index.ts server/src/app.module.ts && git commit -m "feat: add contact form module"`

---

### Task 12: Visit 模块 — 访客统计

**Files:**
- Create: `server/src/modules/visit/visit.module.ts`
- Create: `server/src/modules/visit/visit.controller.ts`
- Create: `server/src/modules/visit/visit.service.ts`
- Modify: `server/src/modules/index.ts`
- Modify: `server/src/app.module.ts`

**Interfaces:**
- Consumes: `RedisService`、`VisitStat` 实体
- Produces: `GET /api/visit/count` — 获取公开访客计数
- Produces: `POST /api/visit/track` — 记录一次 PV
- Produces: `GET /api/admin/analytics` — 获取详细统计数据

- [ ] **Step 1: 创建 Visit Service**

```typescript
// server/src/modules/visit/visit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { VisitStat } from '../../entities';
import { RedisService } from '../../redis';

@Injectable()
export class VisitService {
  constructor(
    @InjectRepository(VisitStat)
    private visitStatRepo: Repository<VisitStat>,
    private redisService: RedisService,
  ) {}

  async trackVisit(fingerprint: string) {
    const today = new Date().toISOString().split('T')[0];
    await this.redisService.incr('visit:pv:today');
    await this.redisService.incr('visit:pv:total');
    await this.redisService.sadd(`visit:uv:today`, fingerprint);
    await this.redisService.sadd(`visit:online:${today}`, fingerprint);
  }

  async getPublicCount() {
    const total = await this.redisService.get('visit:pv:total');
    return { total: parseInt(total || '0', 10) };
  }

  async getAnalytics() {
    const todayPv = parseInt((await this.redisService.get('visit:pv:today')) || '0', 10);
    const totalPv = parseInt((await this.redisService.get('visit:pv:total')) || '0', 10);
    const todayUv = await this.redisService.scard('visit:uv:today');
    const today = new Date().toISOString().split('T')[0];
    const online = await this.redisService.scard(`visit:online:${today}`);

    // 最近 30 天 PV（从 PostgreSQL）
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const dailyStats = await this.visitStatRepo.find({
      where: { date: MoreThanOrEqual(startDate.toISOString().split('T')[0]) },
      order: { date: 'ASC' },
    });

    // 本周 / 本月 PV
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 1);

    const [weekData, monthData] = await Promise.all([
      this.visitStatRepo.find({
        where: { date: MoreThanOrEqual(weekStart.toISOString().split('T')[0]) },
      }),
      this.visitStatRepo.find({
        where: { date: MoreThanOrEqual(monthStart.toISOString().split('T')[0]) },
      }),
    ]);

    const weekPv = weekData.reduce((sum, s) => sum + s.pv, 0);
    const monthPv = monthData.reduce((sum, s) => sum + s.pv, 0);

    return {
      todayPv,
      totalPv,
      weekPv,
      monthPv,
      online,
      dailyStats: dailyStats.map((s) => ({ date: s.date, pv: s.pv, uv: s.uv })),
    };
  }
}
```

- [ ] **Step 2: 创建 Visit Controller**

```typescript
// server/src/modules/visit/visit.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { VisitService } from './visit.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api')
export class VisitController {
  constructor(private visitService: VisitService) {}

  @Public()
  @Get('visit/count')
  getCount() {
    return this.visitService.getPublicCount();
  }

  @Public()
  @Post('visit/track')
  track(@Body('fingerprint') fingerprint: string) {
    return this.visitService.trackVisit(fingerprint || 'anonymous');
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/analytics')
  getAnalytics() {
    return this.visitService.getAnalytics();
  }
}
```

- [ ] **Step 3: 创建 Visit Module 并注册**

```typescript
// server/src/modules/visit/visit.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitStat } from '../../entities';
import { VisitService } from './visit.service';
import { VisitController } from './visit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VisitStat])],
  controllers: [VisitController],
  providers: [VisitService],
})
export class VisitModule {}
```

在 `server/src/modules/index.ts` 添加 `export { VisitModule } from './visit/visit.module';`
在 `server/src/app.module.ts` 的 imports 添加 `VisitModule`

- [ ] **Step 4: 验证**

Run: `cd server ; npm run start:dev`
Expected: 启动成功，`POST http://localhost:3001/api/visit/track` 返回成功

- [ ] **Step 5: 提交**

Run: `git add server/src/modules/visit/ server/src/modules/index.ts server/src/app.module.ts && git commit -m "feat: add visit tracking module with Redis"`

---

### Task 13: Upload 模块 — 项目封面图上传

**Files:**
- Create: `server/src/modules/upload/upload.module.ts`
- Create: `server/src/modules/upload/upload.controller.ts`
- Modify: `server/src/modules/index.ts`
- Modify: `server/src/app.module.ts`

**Interfaces:**
- Produces: `POST /api/admin/upload` — 上传图片，返回 URL

- [ ] **Step 1: 创建 Upload Controller**

```typescript
// server/src/modules/upload/upload.controller.ts
import { Controller, Post, UseInterceptors, UseGuards, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10);

@UseGuards(JwtAuthGuard)
@Controller('api/admin/upload')
@UseInterceptors(FileInterceptor('file', {
  storage: diskStorage({
    destination: join(__dirname, '..', '..', '..', 'uploads'),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      cb(null, unique);
    },
  }),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype)) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
}))
export class UploadController {
  @Post()
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/${file.filename}` };
  }
}
```

- [ ] **Step 2: 创建 Upload Module 并注册**

```typescript
// server/src/modules/upload/upload.module.ts
import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';

@Module({
  controllers: [UploadController],
})
export class UploadModule {}
```

在 `server/src/modules/index.ts` 添加 `export { UploadModule } from './upload/upload.module';`
在 `server/src/app.module.ts` 的 imports 添加 `UploadModule`

- [ ] **Step 3: 创建 uploads 目录并添加 .gitkeep**

Run: `mkdir uploads ; echo. > uploads\.gitkeep`

- [ ] **Step 4: 验证**

Run: `cd server ; npm run start:dev`
Expected: 启动成功，`POST http://localhost:3001/api/admin/upload`（带 JWT Cookie 和 file 字段）返回 `{ url: "/uploads/xxx.png" }`

- [ ] **Step 5: 提交**

Run: `git add server/src/modules/upload/ server/src/modules/index.ts server/src/app.module.ts uploads/.gitkeep && git commit -m "feat: add image upload module"`

---

### Task 14: 定时任务 — Redis 访客计数持久化到 PostgreSQL

**Files:**
- Create: `server/src/modules/visit/visit.cron.ts`
- Modify: `server/src/modules/visit/visit.module.ts`
- Modify: `server/src/app.module.ts`

**Interfaces:**
- Consumes: `RedisService`、`VisitStat` 实体、`ScheduleModule`

- [ ] **Step 1: 安装 schedule 依赖**

Run: `cd server ; npm install @nestjs/schedule`

- [ ] **Step 2: 创建定时任务**

```typescript
// server/src/modules/visit/visit.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitStat } from '../../entities';
import { RedisService } from '../../redis';

@Injectable()
export class VisitCron {
  private readonly logger = new Logger(VisitCron.name);

  constructor(
    @InjectRepository(VisitStat)
    private visitStatRepo: Repository<VisitStat>,
    private redisService: RedisService,
  ) {}

  // 每分钟将当日 Redis 计数持久化到 PostgreSQL
  @Cron(CronExpression.EVERY_MINUTE)
  async persistDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    const pvStr = await this.redisService.get('visit:pv:today');
    const uv = await this.redisService.scard('visit:uv:today');
    const pv = parseInt(pvStr || '0', 10);

    if (pv === 0) return;

    let stat = await this.visitStatRepo.findOne({ where: { date: today } });
    if (!stat) {
      stat = this.visitStatRepo.create({ date: today, pv, uv });
    } else {
      stat.pv = pv;
      stat.uv = uv;
    }
    await this.visitStatRepo.save(stat);
    this.logger.log(`Persisted ${today}: pv=${pv}, uv=${uv}`);
  }

  // 每天 00:01 重置今日计数（前一天已被持久化）
  @Cron('1 0 * * *')
  async resetDailyCounters() {
    await this.redisService.del('visit:pv:today');
    await this.redisService.del('visit:uv:today');
    this.logger.log('Reset daily visit counters');
  }
}
```

- [ ] **Step 3: 在 VisitModule 注册 VisitCron**

```typescript
// server/src/modules/visit/visit.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitStat } from '../../entities';
import { VisitService } from './visit.service';
import { VisitController } from './visit.controller';
import { VisitCron } from './visit.cron';

@Module({
  imports: [TypeOrmModule.forFeature([VisitStat])],
  controllers: [VisitController],
  providers: [VisitService, VisitCron],
})
export class VisitModule {}
```

- [ ] **Step 4: 在 AppModule 注册 ScheduleModule**

在 `server/src/app.module.ts` 的 imports 数组开头添加 `ScheduleModule.forRoot()`，并 import：
```typescript
import { ScheduleModule } from '@nestjs/schedule';
```

- [ ] **Step 5: 验证**

Run: `cd server ; npm run start:dev`
Expected: 启动成功，日志中出现 `Persisted ...` 定时任务输出（需先调用 `/api/visit/track` 产生计数）

- [ ] **Step 6: 提交**

Run: `git add server/src/modules/visit/visit.cron.ts server/src/modules/visit/visit.module.ts server/src/app.module.ts server/package.json && git commit -m "feat: add cron job to persist visit stats from Redis to PostgreSQL"`

---

## Phase 4: 前端基础

### Task 15: API 客户端与类型定义

**Files:**
- Create: `web/lib/api.ts`
- Create: `web/lib/types.ts`
- Create: `web/lib/fingerprint.ts`

**Interfaces:**
- Produces: `fetchApi` 函数（自动携带 Cookie）
- Produces: 所有 API 响应的 TypeScript 类型

- [ ] **Step 1: 创建类型定义**

```typescript
// web/lib/types.ts
export interface SocialLinks {
  github?: string;
  linkedin?: string;
  email?: string;
  twitter?: string;
}

export interface Skill {
  name: string;
  category: string;
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface Education {
  school: string;
  degree: string;
  period: string;
  description: string;
}

export interface Profile {
  id: number;
  name: string;
  title: string;
  bio?: string;
  about?: string;
  avatar_url?: string;
  social_links: SocialLinks;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  cover_url?: string;
  tech_stack: string[];
  demo_url?: string;
  github_url?: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Blog {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  tags: string[];
  status: 'draft' | 'published';
  view_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogListResponse {
  items: Blog[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Analytics {
  todayPv: number;
  totalPv: number;
  weekPv: number;
  monthPv: number;
  online: number;
  dailyStats: { date: string; pv: number; uv: number }[];
}
```

- [ ] **Step 2: 创建 API 客户端**

```typescript
// web/lib/api.ts
import type {
  Profile, Project, Blog, BlogListResponse,
  ContactMessage, Analytics,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    // Server Components 中需强制动态获取，避免缓存
    cache: options.cache ?? 'no-store',
  });

  if (!res.ok) {
    const msg = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(res.status, (msg as any).message || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // 公开接口
  getProfile: () => fetchApi<Profile>('/api/profile'),
  getProjects: (tag?: string) =>
    fetchApi<Project[]>(`/api/projects${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`),
  getProject: (slug: string) => fetchApi<Project>(`/api/projects/${slug}`),
  getBlogs: (page = 1, limit = 10, tag?: string) =>
    fetchApi<BlogListResponse>(`/api/blogs?page=${page}&limit=${limit}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`),
  getBlog: (slug: string) => fetchApi<Blog>(`/api/blogs/${slug}`),
  submitContact: (data: { name: string; email: string; message: string }) =>
    fetchApi<void>('/api/contact', { method: 'POST', body: JSON.stringify(data) }),
  trackVisit: (fingerprint: string) =>
    fetchApi<void>('/api/visit/track', { method: 'POST', body: JSON.stringify({ fingerprint }) }),
  getVisitCount: () => fetchApi<{ total: number }>('/api/visit/count'),
  loginGithub: () => {
    window.location.href = `${API_URL}/api/auth/github`;
  },
  logout: () => fetchApi<void>('/api/auth/logout', { method: 'POST' }),

  // 管理接口
  admin: {
    getBlogs: () => fetchApi<Blog[]>('/api/admin/blogs'),
    createBlog: (data: Partial<Blog>) =>
      fetchApi<Blog>('/api/admin/blogs', { method: 'POST', body: JSON.stringify(data) }),
    updateBlog: (id: number, data: Partial<Blog>) =>
      fetchApi<Blog>(`/api/admin/blogs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteBlog: (id: number) =>
      fetchApi<void>(`/api/admin/blogs/${id}`, { method: 'DELETE' }),
    publishBlog: (id: number) =>
      fetchApi<Blog>(`/api/admin/blogs/${id}/publish`, { method: 'PATCH' }),
    unpublishBlog: (id: number) =>
      fetchApi<Blog>(`/api/admin/blogs/${id}/unpublish`, { method: 'PATCH' }),

    getProjects: () => fetchApi<Project[]>('/api/admin/projects'),
    createProject: (data: Partial<Project>) =>
      fetchApi<Project>('/api/admin/projects', { method: 'POST', body: JSON.stringify(data) }),
    updateProject: (id: number, data: Partial<Project>) =>
      fetchApi<Project>(`/api/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProject: (id: number) =>
      fetchApi<void>(`/api/admin/projects/${id}`, { method: 'DELETE' }),
    reorderProjects: (items: { id: number; sort_order: number }[]) =>
      fetchApi<{ success: boolean }>('/api/admin/projects/reorder', {
        method: 'PUT', body: JSON.stringify({ items }),
      }),

    getProfile: () => fetchApi<Profile>('/api/admin/profile'),
    updateProfile: (data: Partial<Profile>) =>
      fetchApi<Profile>('/api/admin/profile', { method: 'PUT', body: JSON.stringify(data) }),

    uploadImage: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return fetchApi<{ url: string }>('/api/admin/upload', { method: 'POST', body: form as any });
    },

    getAnalytics: () => fetchApi<Analytics>('/api/admin/analytics'),
    getContacts: () => fetchApi<ContactMessage[]>('/api/admin/contacts'),
    markContactRead: (id: number) =>
      fetchApi<ContactMessage>(`/api/admin/contacts/${id}/read`, { method: 'PATCH' }),
  },
};

export { ApiError };
```

- [ ] **Step 3: 创建浏览器指纹工具（用于 UV/在线统计）**

```typescript
// web/lib/fingerprint.ts
export function getFingerprint(): string {
  if (typeof window === 'undefined') return 'ssr';
  const parts = [
    navigator.userAgent,
    navigator.language,
    (navigator.languages || []).join(','),
    String(screen.width) + 'x' + String(screen.height),
    new Date().getTimezoneOffset().toString(),
  ];
  let hash = 0;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
```

- [ ] **Step 4: 提交**

Run: `git add web/lib/ && git commit -m "feat: add API client, types, and fingerprint util"`

---

### Task 16: 主题系统与根布局

**Files:**
- Create: `web/components/theme-provider.tsx`
- Create: `web/components/theme-toggle.tsx`
- Create: `web/components/visit-tracker.tsx`
- Create: `web/app/globals.css`（覆盖默认）
- Modify: `web/app/layout.tsx`

**Interfaces:**
- Produces: 深色/浅色主题切换（class 切换 + localStorage 持久化）
- Produces: 自动访客追踪（每次页面加载上报 PV）

- [ ] **Step 1: 安装主题依赖**

Run: `cd web ; npm install next-themes`

- [ ] **Step 2: 创建 ThemeProvider**

```tsx
// web/components/theme-provider.tsx
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 3: 创建主题切换按钮**

```tsx
// web/components/theme-toggle.tsx
'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-md border border-gray-300 dark:border-gray-700 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

- [ ] **Step 4: 创建访客追踪组件**

```tsx
// web/components/visit-tracker.tsx
'use client';
import { useEffect } from 'react';
import { trackVisit } from '@/lib/api';
import { getFingerprint } from '@/lib/fingerprint';

export function VisitTracker() {
  useEffect(() => {
    const fp = getFingerprint();
    // 通过 sessionStorage 防止短时间重复上报
    const key = `visit:${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    trackVisit(fp).catch(() => {});
  }, []);
  return null;
}
```

- [ ] **Step 5: 配置 Tailwind 深色模式（class 策略），更新 globals.css**

```css
/* web/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100;
    font-feature-settings: 'rlig' 1, 'calt' 1;
  }
}

/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}
```

修改 `web/tailwind.config.ts` 的 `darkMode`：
```typescript
// web/tailwind.config.ts（仅 darkMode 这一项需改）
const config = {
  darkMode: 'class',
  // ... 其余保持 create-next-app 默认
};
export default config;
```

- [ ] **Step 6: 更新根布局**

```tsx
// web/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { VisitTracker } from '@/components/visit-tracker';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Your Name | Full-Stack Developer',
    template: '%s | Your Name',
  },
  description: '个人作品集与博客',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <VisitTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: 验证**

Run: `cd web ; npm run dev`
Expected: http://localhost:3000 正常打开，主题切换按钮可切换深/浅色，控制台发起 `/api/visit/track` 请求

- [ ] **Step 8: 提交**

Run: `git add web/components/ web/app/globals.css web/app/layout.tsx web/tailwind.config.ts web/package.json && git commit -m "feat: add theme system, visit tracker, and root layout"`

---

## Phase 5: 前台公开页面

### Task 17: 共享布局组件（Header / Footer / Markdown 渲染器）

**Files:**
- Create: `web/components/site-header.tsx`
- Create: `web/components/site-footer.tsx`
- Create: `web/components/markdown.tsx`
- Create: `web/components/section.tsx`

**Interfaces:**
- Produces: 前台导航栏、页脚、Markdown 内容渲染组件

- [ ] **Step 1: 创建顶部导航栏**

```tsx
// web/components/site-header.tsx
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

const NAV = [
  { href: '/', label: '首页' },
  { href: '/about', label: '关于' },
  { href: '/projects', label: '项目' },
  { href: '/blog', label: '博客' },
  { href: '/contact', label: '联系' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 backdrop-blur bg-white/80 dark:bg-gray-950/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-bold tracking-tight">Your Name</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
      {/* 移动端横向滚动导航 */}
      <nav className="md:hidden flex items-center gap-4 overflow-x-auto px-4 pb-2 text-sm">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="whitespace-nowrap text-gray-600 dark:text-gray-400">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: 创建页脚（含访客计数）**

```tsx
// web/components/site-footer.tsx
import Link from 'next/link';

export async function SiteFooter() {
  let total = 0;
  try {
    const { getVisitCount } = await import('@/lib/api');
    const data = await getVisitCount();
    total = data.total;
  } catch {}

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Your Name. All rights reserved.</p>
        <p>总访问量：{total.toLocaleString()}</p>
        <nav className="flex gap-4">
          <Link href="/contact">联系我</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: 创建 Section 通用容器**

```tsx
// web/components/section.tsx
import { ReactNode } from 'react';

export function Section({
  title, children, action,
}: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="container mx-auto px-4 py-12">
      {(title || action) && (
        <div className="flex items-center justify-between mb-6">
          {title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
```

- [ ] **Step 4: 创建 Markdown 渲染组件（支持代码高亮、TOC 锚点）**

```tsx
// web/components/markdown.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-pre:bg-gray-900 prose-pre:rounded-lg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeHighlight,
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 5: 安装 prose 样式依赖**

Run: `cd web ; npm install @tailwindcss/typography`

在 `web/tailwind.config.ts` 的 `plugins` 中添加 `require('@tailwindcss/typography')`。

- [ ] **Step 6: 提交**

Run: `git add web/components/site-header.tsx web/components/site-footer.tsx web/components/section.tsx web/components/markdown.tsx web/tailwind.config.ts web/package.json && git commit -m "feat: add shared site header, footer, section, markdown components"`

---

### Task 18: 首页 `/`

**Files:**
- Modify: `web/app/page.tsx`

**Interfaces:**
- Consumes: `api.getProfile`、`api.getProjects`、`api.getBlogs`、`SiteHeader`、`SiteFooter`、`Section`

- [ ] **Step 1: 实现首页**

```tsx
// web/app/page.tsx
import Link from 'next/link';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Section } from '@/components/section';
import type { Profile, Project, Blog } from '@/lib/types';

export default async function HomePage() {
  let profile: Profile | null = null;
  let projects: Project[] = [];
  let blogs: Blog[] = [];

  try {
    [profile, projects, blogs] = await Promise.all([
      api.getProfile().catch(() => null),
      api.getProjects().catch(() => []),
      api.getBlogs(1, 3).then((r) => r.items).catch(() => []),
    ]);
  } catch {}

  const skills = profile?.skills ?? [];
  const skillCategories = Array.from(new Set(skills.map((s) => s.category)));

  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 md:py-32 text-center">
        {profile?.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={profile.name} className="w-24 h-24 rounded-full mx-auto mb-6" />
        )}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          {profile?.name || 'Your Name'}
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-gray-600 dark:text-gray-400">
          {profile?.title || 'Full-Stack Developer'}
        </p>
        <p className="mt-4 max-w-xl mx-auto text-gray-500">{profile?.bio}</p>
        <div className="mt-8 flex justify-center gap-4">
          {profile?.social_links?.github && (
            <a href={profile.social_links.github} target="_blank" rel="noreferrer" className="text-sm underline">GitHub</a>
          )}
          {profile?.social_links?.linkedin && (
            <a href={profile.social_links.linkedin} target="_blank" rel="noreferrer" className="text-sm underline">LinkedIn</a>
          )}
          {profile?.social_links?.email && (
            <a href={`mailto:${profile.social_links.email}`} className="text-sm underline">Email</a>
          )}
        </div>
      </section>

      {/* 技能展示 */}
      {skills.length > 0 && (
        <Section title="技能">
          <div className="grid gap-8 md:grid-cols-3">
            {skillCategories.map((cat) => (
              <div key={cat}>
                <h3 className="font-semibold mb-3">{cat}</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.filter((s) => s.category === cat).map((s) => (
                    <span key={s.name} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 精选项目 */}
      <Section title="精选项目" action={<Link href="/projects" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">查看全部 →</Link>}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 3).map((p) => (
            <Link key={p.id} href={`/projects/${p.slug}`} className="group rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition">
              {p.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover_url} alt={p.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-semibold group-hover:text-blue-500 transition">{p.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.tech_stack.slice(0, 3).map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* 最新博客 */}
      <Section title="最新博客" action={<Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">查看全部 →</Link>}>
        <div className="grid gap-6 md:grid-cols-3">
          {blogs.map((b) => (
            <Link key={b.id} href={`/blog/${b.slug}`} className="group rounded-lg border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg transition">
              <p className="text-xs text-gray-500">{b.published_at?.slice(0, 10)}</p>
              <h3 className="font-semibold mt-1 group-hover:text-blue-500 transition">{b.title}</h3>
              <p className="text-sm text-gray-500 mt-2 line-clamp-3">{b.summary}</p>
            </Link>
          ))}
        </div>
      </Section>

      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: 验证**

Run: `cd web ; npm run dev`
Expected: http://localhost:3000 显示 Hero、技能、项目、博客、页脚

- [ ] **Step 3: 提交**

Run: `git add web/app/page.tsx && git commit -m "feat: add home page with hero, skills, featured projects and latest blogs"`

---

### Task 19: 关于我 `/about`

**Files:**
- Create: `web/app/about/page.tsx`

- [ ] **Step 1: 实现关于页**

```tsx
// web/app/about/page.tsx
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Markdown } from '@/components/markdown';

export const metadata: Metadata = {
  title: '关于我',
  description: '个人介绍、工作经历与教育背景',
};

export default async function AboutPage() {
  let profile = null;
  try {
    profile = await api.getProfile();
  } catch {}

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">关于我</h1>

        <div className="flex items-start gap-6 mb-12">
          {profile?.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.name} className="w-28 h-28 rounded-full" />
          )}
          <div>
            <h2 className="text-xl font-semibold">{profile?.name}</h2>
            <p className="text-gray-500">{profile?.title}</p>
            {profile?.about && <div className="mt-4"><Markdown content={profile.about} /></div>}
          </div>
        </div>

        {/* 工作经历时间线 */}
        {profile?.experience?.length > 0 && (
          <section className="mb-12">
            <h3 className="text-xl font-semibold mb-4">工作经历</h3>
            <ol className="relative border-l border-gray-200 dark:border-gray-800 pl-6 space-y-6">
              {profile.experience.map((e, i) => (
                <li key={i}>
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-blue-500" />
                  <p className="text-sm text-gray-500">{e.period}</p>
                  <h4 className="font-semibold">{e.role} · {e.company}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{e.description}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 教育背景 */}
        {profile?.education?.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold mb-4">教育背景</h3>
            <div className="space-y-4">
              {profile.education.map((e, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-500">{e.period}</p>
                  <h4 className="font-semibold">{e.degree} · {e.school}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{e.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: 验证 & 提交**

Run: `cd web ; npm run dev` → 访问 http://localhost:3000/about
Run: `git add web/app/about/ && git commit -m "feat: add about page with experience and education timeline"`

---

### Task 20: 项目列表 `/projects` 与详情 `/projects/[slug]`

**Files:**
- Create: `web/app/projects/page.tsx`
- Create: `web/components/project-filter.tsx`（客户端标签筛选）
- Create: `web/app/projects/[slug]/page.tsx`
- Create: `web/app/projects/[slug]/not-found.tsx`

- [ ] **Step 1: 创建客户端标签筛选组件**

```tsx
// web/components/project-filter.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Project } from '@/lib/types';

export function ProjectFilter({ projects, tags }: { projects: Project[]; tags: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const filtered = active ? projects.filter((p) => p.tech_stack.includes(active)) : projects;

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActive(null)}
          className={`px-3 py-1 rounded-full text-sm border transition ${active === null ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent' : 'border-gray-300 dark:border-gray-700'}`}
        >
          全部
        </button>
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-1 rounded-full text-sm border transition ${active === t ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent' : 'border-gray-300 dark:border-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Link key={p.id} href={`/projects/${p.slug}`} className="group rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition">
            {p.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.cover_url} alt={p.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-semibold group-hover:text-blue-500 transition">{p.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {p.tech_stack.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: 实现项目列表页**

```tsx
// web/app/projects/page.tsx
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Section } from '@/components/section';
import { ProjectFilter } from '@/components/project-filter';

export const metadata: Metadata = {
  title: '项目',
  description: '我的项目作品集',
};

export default async function ProjectsPage() {
  const projects = await api.getProjects().catch(() => []);
  const tags = Array.from(new Set(projects.flatMap((p) => p.tech_stack)));

  return (
    <>
      <SiteHeader />
      <Section title="项目作品">
        <ProjectFilter projects={projects} tags={tags} />
      </Section>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 3: 实现项目详情页**

```tsx
// web/app/projects/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Markdown } from '@/components/markdown';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const p = await api.getProject(params.slug);
    return { title: p.title, description: p.description };
  } catch {
    return { title: '项目不存在' };
  }
}

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  let project;
  try {
    project = await api.getProject(params.slug);
  } catch {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <article className="container mx-auto px-4 py-16 max-w-3xl">
        <Link href="/projects" className="text-sm text-gray-500 hover:underline mb-6 inline-block">← 返回项目列表</Link>

        {project.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.cover_url} alt={project.title} className="w-full rounded-lg mb-6" />
        )}

        <h1 className="text-3xl font-bold">{project.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.tech_stack.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t}</span>
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          {project.demo_url && (
            <a href={project.demo_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded bg-blue-500 text-white text-sm hover:bg-blue-600">在线演示</a>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">GitHub</a>
          )}
        </div>

        {project.content && (
          <div className="mt-8"><Markdown content={project.content} /></div>
        )}
      </article>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 4: 创建 404 页**

```tsx
// web/app/projects/[slug]/not-found.tsx
import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-32 text-center">
      <h1 className="text-2xl font-bold">项目不存在</h1>
      <Link href="/projects" className="mt-4 inline-block text-blue-500 underline">返回项目列表</Link>
    </div>
  );
}
```

- [ ] **Step 5: 验证 & 提交**

Run: `cd web ; npm run dev` → 访问 /projects 和 /projects/任意-slug
Run: `git add web/app/projects/ web/components/project-filter.tsx && git commit -m "feat: add project list with tag filter and project detail page"`

---

### Task 21: 博客列表 `/blog` 与详情 `/blog/[slug]`

**Files:**
- Create: `web/app/blog/page.tsx`
- Create: `web/components/blog-pagination.tsx`（客户端分页 + 标签）
- Create: `web/app/blog/[slug]/page.tsx`
- Create: `web/app/blog/[slug]/not-found.tsx`

- [ ] **Step 1: 创建博客列表分页/标签组件**

```tsx
// web/components/blog-pagination.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Blog } from '@/lib/types';

export function BlogList({ initialBlogs, totalPages, tags }: {
  initialBlogs: Blog[]; totalPages: number; tags: string[];
}) {
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState<string | null>(null);
  const [blogs, setBlogs] = useState(initialBlogs);
  const [loading, setLoading] = useState(false);

  async function load(newPage: number, newTag: string | null) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/blog-loader?page=${newPage}${newTag ? `&tag=${encodeURIComponent(newTag)}` : ''}`
      ).then((r) => r.json());
      setBlogs(res.items);
      setPage(newPage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        <button onClick={() => { setTag(null); load(1, null); }}
          className={`px-3 py-1 rounded-full text-sm border ${tag === null ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent' : 'border-gray-300 dark:border-gray-700'}`}>
          全部
        </button>
        {tags.map((t) => (
          <button key={t} onClick={() => { setTag(t); load(1, t); }}
            className={`px-3 py-1 rounded-full text-sm border ${tag === t ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent' : 'border-gray-300 dark:border-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {blogs.map((b) => (
          <Link key={b.id} href={`/blog/${b.slug}`} className="group rounded-lg border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg transition">
            <p className="text-xs text-gray-500">{b.published_at?.slice(0, 10)} · 阅读 {b.view_count}</p>
            <h3 className="font-semibold mt-1 group-hover:text-blue-500 transition">{b.title}</h3>
            <p className="text-sm text-gray-500 mt-2 line-clamp-3">{b.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {b.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-2">
        <button disabled={page === 1 || loading} onClick={() => load(page - 1, tag)} className="px-3 py-1 text-sm border rounded disabled:opacity-50">上一页</button>
        <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
        <button disabled={page >= totalPages || loading} onClick={() => load(page + 1, tag)} className="px-3 py-1 text-sm border rounded disabled:opacity-50">下一页</button>
      </div>
    </>
  );
}
```

- [ ] **Step 2: 创建博客数据加载 API 路由（避免跨域直接调后端）**

```ts
// web/app/api/blog-loader/route.ts
import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') || '1';
  const tag = searchParams.get('tag') || '';
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/blogs?page=${page}${tag ? `&tag=${tag}` : ''}`;
  const res = await fetch(apiUrl, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data);
}
```

- [ ] **Step 3: 实现博客列表页**

```tsx
// web/app/blog/page.tsx
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Section } from '@/components/section';
import { BlogList } from '@/components/blog-pagination';

export const metadata: Metadata = {
  title: '博客',
  description: '我的技术博客文章',
};

export default async function BlogPage() {
  const data = await api.getBlogs(1, 10).catch(() => ({ items: [], total: 0, page: 1, totalPages: 1 }));
  const tags = Array.from(new Set(data.items.flatMap((b) => b.tags)));

  return (
    <>
      <SiteHeader />
      <Section title="博客">
        <BlogList initialBlogs={data.items} totalPages={data.totalPages} tags={tags} />
      </Section>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 4: 实现博客详情页（含 TOC、上一篇/下一篇）**

```tsx
// web/app/blog/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Markdown } from '@/components/markdown';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const b = await api.getBlog(params.slug);
    return { title: b.title, description: b.summary };
  } catch {
    return { title: '文章不存在' };
  }
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  let blog;
  try {
    blog = await api.getBlog(params.slug);
  } catch {
    notFound();
  }

  // 获取上一篇/下一篇（取最新列表做近似）
  const list = await api.getBlogs(1, 100).catch(() => ({ items: [] as any[] }));
  const idx = list.items.findIndex((b) => b.slug === params.slug);
  const prev = idx > 0 ? list.items[idx - 1] : null;
  const next = idx < list.items.length - 1 ? list.items[idx + 1] : null;

  return (
    <>
      <SiteHeader />
      <article className="container mx-auto px-4 py-16 max-w-3xl">
        <Link href="/blog" className="text-sm text-gray-500 hover:underline mb-6 inline-block">← 返回博客列表</Link>

        <p className="text-sm text-gray-500">
          {blog.published_at?.slice(0, 10)} · 阅读 {blog.view_count}
        </p>
        <h1 className="text-3xl font-bold mt-2">{blog.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {blog.tags.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{t}</span>
          ))}
        </div>

        <div className="mt-8"><Markdown content={blog.content} /></div>

        {/* 上一篇/下一篇 */}
        <nav className="mt-12 grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-800 pt-6">
          {prev ? (
            <Link href={`/blog/${prev.slug}`} className="text-sm hover:underline">
              <span className="text-gray-500">← 上一篇</span>
              <p className="font-medium">{prev.title}</p>
            </Link>
          ) : <div />}
          {next ? (
            <Link href={`/blog/${next.slug}`} className="text-sm hover:underline text-right">
              <span className="text-gray-500">下一篇 →</span>
              <p className="font-medium">{next.title}</p>
            </Link>
          ) : <div />}
        </nav>
      </article>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 5: 创建 404 页 & 验证提交**

```tsx
// web/app/blog/[slug]/not-found.tsx
import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-32 text-center">
      <h1 className="text-2xl font-bold">文章不存在</h1>
      <Link href="/blog" className="mt-4 inline-block text-blue-500 underline">返回博客列表</Link>
    </div>
  );
}
```

Run: `cd web ; npm run dev` → 访问 /blog 和 /blog/任意-slug
Run: `git add web/app/blog/ web/app/api/blog-loader/ web/components/blog-pagination.tsx && git commit -m "feat: add blog list with pagination/tags and blog detail with prev/next nav"`

---

### Task 22: 联系我 `/contact`

**Files:**
- Create: `web/app/contact/page.tsx`
- Create: `web/components/contact-form.tsx`（客户端表单）

- [ ] **Step 1: 创建联系表单组件**

```tsx
// web/components/contact-form.tsx
'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await api.submitContact(form);
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch (err: any) {
      setStatus('error');
      setError(err.message || '提交失败，请稍后再试');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 p-6 text-center">
        <p className="font-semibold">提交成功，感谢您的留言！</p>
        <button onClick={() => setStatus('idle')} className="mt-3 text-sm underline">再次提交</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">姓名</label>
        <input
          required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">邮箱</label>
        <input
          required type="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">消息内容</label>
        <textarea
          required rows={6} value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
        />
      </div>
      {status === 'error' && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit" disabled={status === 'loading'}
        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {status === 'loading' ? '提交中...' : '提交'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 实现联系页**

```tsx
// web/app/contact/page.tsx
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Section } from '@/components/section';
import { ContactForm } from '@/components/contact-form';

export const metadata: Metadata = {
  title: '联系我',
  description: '通过表单给我留言',
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <Section title="联系我">
        <div className="max-w-xl">
          <p className="text-gray-500 mb-6">有任何问题或合作意向，欢迎给我留言。</p>
          <ContactForm />
        </div>
      </Section>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 3: 验证 & 提交**

Run: `cd web ; npm run dev` → 访问 /contact，填写表单提交
Run: `git add web/app/contact/ web/components/contact-form.tsx && git commit -m "feat: add contact page with submission form"`

---

## Phase 6: 管理后台

### Task 23: 管理后台登录、鉴权中间件与 Ant Design 布局

**Files:**
- Create: `web/middleware.ts`
- Create: `web/components/antd-registry.tsx`（Next.js App Router 兼容）
- Create: `web/app/admin/login/page.tsx`
- Create: `web/app/admin/layout.tsx`
- Create: `web/app/admin/layout-client.tsx`（客户端 AntD Layout）

**Interfaces:**
- Produces: `/admin/login` GitHub 登录入口
- Produces: 全局 middleware 拦截未登录的 `/admin/*`（除 login）
- Produces: `/admin/*` 共享 Ant Design Layout（侧边栏 + 顶栏）

- [ ] **Step 1: 创建鉴权中间件**

```typescript
// web/middleware.ts
import { NextResponse, NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // 登录页本身不拦截
  if (pathname === '/admin/login') return NextResponse.next();

  // 通过调用后端的受保护接口（/api/admin/profile）判断 JWT 是否有效
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const cookie = req.headers.get('cookie') || '';

  try {
    const res = await fetch(`${apiUrl}/api/admin/profile`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (res.ok) return NextResponse.next();
  } catch {}

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

- [ ] **Step 2: 创建 AntD Next.js Registry**

```tsx
// web/components/antd-registry.tsx
'use client';
import { StyleProvider } from '@ant-design/cssinjs';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { ReactNode } from 'react';

export function AntdRegistryProvider({ children }: { children: ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: antdTheme.darkAlgorithm,
          token: { colorPrimary: '#3b82f6' },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
```

- [ ] **Step 3: 安装 cssinjs 依赖**

Run: `cd web ; npm install @ant-design/cssinjs`

- [ ] **Step 4: 创建登录页**

```tsx
// web/app/admin/login/page.tsx
'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Card } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';

function LoginInner() {
  const search = useSearchParams();
  const router = useRouter();
  const redirect = search.get('redirect') || '/admin/dashboard';

  // 若已登录则直接跳转
  useEffect(() => {
    api.admin.getProfile().then(() => router.replace(redirect)).catch(() => {});
  }, [redirect, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Card className="w-96 text-center">
        <h1 className="text-xl font-bold mb-2 text-white">管理后台</h1>
        <p className="text-gray-400 mb-6">使用 GitHub 账号登录</p>
        <Button type="primary" size="large" icon={<GithubOutlined />} block onClick={() => api.loginGithub()}>
          使用 GitHub 登录
        </Button>
      </Card>
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

- [ ] **Step 5: 创建客户端 AntD Layout**

```tsx
// web/app/admin/layout-client.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';

const { Header, Sider, Content } = Layout;

const MENUS = [
  { key: '/admin/dashboard', label: '仪表盘' },
  { key: '/admin/blogs', label: '博客管理' },
  { key: '/admin/projects', label: '项目管理' },
  { key: '/admin/profile', label: '个人信息' },
  { key: '/admin/analytics', label: '访客统计' },
];

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();

  const current = '/' + pathname.split('/').slice(0, 3).join('/').split('/').filter(Boolean).slice(0, 2).join('/');

  async function logout() {
    await api.logout().catch(() => {});
    router.replace('/admin/login');
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ height: 48, color: '#fff', textAlign: 'center', lineHeight: '48px', fontWeight: 600 }}>
          {collapsed ? 'P' : 'Portfolio Admin'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={MENUS.map((m) => ({ key: m.key, label: <Link href={m.key}>{m.label}</Link> }))}
        />
      </Sider>
      <Layout>
        <Header style={{ background: token.colorBgContainer, padding: '0 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: [{ key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: logout }] }}>
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>管理员</span>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: token.colorBgContainer, borderRadius: 8 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
```

- [ ] **Step 6: 创建 admin layout（区分登录页与受保护页）**

```tsx
// web/app/admin/layout.tsx
import { ReactNode } from 'react';
import { AntdRegistryProvider } from '@/components/antd-registry';

export default function AdminLayout({ children }: { children: ReactNode }) {
  // 登录页（/admin/login）不需要侧边栏，通过 children 自身渲染；
  // 其他 /admin/* 页面在各自的 layout/page 里使用 AdminLayoutClient。
  // 这里统一注入 AntD Registry。
  return <AntdRegistryProvider>{children}</AntdRegistryProvider>;
}
```

- [ ] **Step 7: 创建受保护区域的子 layout（含侧边栏）**

```tsx
// web/app/admin/(protected)/layout.tsx
import { ReactNode } from 'react';
import { AdminLayoutClient } from '@/app/admin/layout-client';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
```

> 说明：使用路由组 `(protected)` 让所有受保护页面共享侧边栏布局，`/admin/login` 不在组内。

- [ ] **Step 8: 验证 & 提交**

Run: `cd web ; npm run dev`
Expected: 访问 /admin/dashboard 未登录时被重定向到 /admin/login；登录页显示 GitHub 按钮

Run: `git add web/middleware.ts web/components/antd-registry.tsx web/app/admin/ && git commit -m "feat: add admin login, auth middleware, and Ant Design layout"`

---

### Task 24: 仪表盘 `/admin/dashboard`

**Files:**
- Create: `web/app/admin/(protected)/dashboard/page.tsx`
- Create: `web/components/charts/pv-line.tsx`（折线图）

**Interfaces:**
- Consumes: `api.admin.getAnalytics`、`api.getBlogs`、`api.admin.getProjects`

- [ ] **Step 1: 安装图表库**

Run: `cd web ; npm install @ant-design/charts @ant-design/plots`

- [ ] **Step 2: 创建 PV 折线图组件**

```tsx
// web/components/charts/pv-line.tsx
'use client';
import { Line } from '@ant-design/charts';

export function PvLine({ data }: { data: { date: string; pv: number }[] }) {
  return (
    <Line
      data={data}
      xField="date"
      yField="pv"
      height={300}
      smooth
      point={{ size: 4, shape: 'circle' }}
      tooltip={{ showMarkers: false }}
    />
  );
}
```

- [ ] **Step 3: 实现仪表盘页**

```tsx
// web/app/admin/(protected)/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { api } from '@/lib/api';
import { PvLine } from '@/components/charts/pv-line';
import type { Analytics, Blog, Project } from '@/lib/types';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.admin.getAnalytics().catch(() => null),
      api.admin.getBlogs().catch(() => []),
      api.getProjects().catch(() => []),
    ]).then(([a, b, p]) => {
      setAnalytics(a);
      setBlogs(b);
      setProjects(p);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spin />;

  // 最近 7 天数据
  const weekData = (analytics?.dailyStats ?? [])
    .slice(-7)
    .map((s) => ({ date: s.date.slice(5), pv: s.pv }));

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">仪表盘</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card><Statistic title="总访问量" value={analytics?.totalPv ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="今日 PV" value={analytics?.todayPv ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="在线人数" value={analytics?.online ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="博客数量" value={blogs.length} /></Card>
        </Col>
      </Row>

      <Card title="最近 7 天 PV" className="mt-4">
        {weekData.length > 0 ? <PvLine data={weekData} /> : <p>暂无数据</p>}
      </Card>
    </>
  );
}
```

- [ ] **Step 4: 验证 & 提交**

Run: `cd web ; npm run dev` → 登录后访问 /admin/dashboard
Run: `git add web/app/admin/\(protected\)/dashboard/ web/components/charts/ web/package.json && git commit -m "feat: add admin dashboard with stats and PV chart"`

---

### Task 25: 博客管理 `/admin/blogs` 与编辑 `/admin/blogs/[id]/edit`

**Files:**
- Create: `web/app/admin/(protected)/blogs/page.tsx`
- Create: `web/components/admin/blog-editor.tsx`（Markdown 分屏编辑器）
- Create: `web/app/admin/(protected)/blogs/[id]/edit/page.tsx`
- Create: `web/app/admin/(protected)/blogs/new/page.tsx`

- [ ] **Step 1: 创建博客管理列表页**

```tsx
// web/app/admin/(protected)/blogs/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Space, Tag, Input, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import type { Blog } from '@/lib/types';

export default function BlogsAdminPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  async function load() {
    setLoading(true);
    const data = await api.admin.getBlogs();
    setBlogs(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function publish(id: number) {
    await api.admin.publishBlog(id);
    message.success('已发布'); load();
  }
  async function unpublish(id: number) {
    await api.admin.unpublishBlog(id);
    message.success('已下线'); load();
  }
  async function remove(id: number) {
    await api.admin.deleteBlog(id);
    message.success('已删除'); load();
  }

  const filtered = blogs.filter((b) => b.title.toLowerCase().includes(keyword.toLowerCase()));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>博客管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/admin/blogs/new')}>新建文章</Button>
      </div>

      <Input.Search placeholder="搜索标题" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ marginBottom: 16, maxWidth: 300 }} />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        columns={[
          { title: '标题', dataIndex: 'title' },
          {
            title: '标签', dataIndex: 'tags', render: (tags: string[]) => tags.map((t) => <Tag key={t}>{t}</Tag>),
          },
          {
            title: '状态', dataIndex: 'status', render: (s: string) => (
              <Tag color={s === 'published' ? 'green' : 'default'}>{s === 'published' ? '已发布' : '草稿'}</Tag>
            ),
          },
          { title: '创建时间', dataIndex: 'created_at', render: (t: string) => t.slice(0, 10) },
          {
            title: '操作', render: (_, record) => (
              <Space>
                <a onClick={() => router.push(`/admin/blogs/${record.id}/edit`)}>编辑</a>
                {record.status === 'draft' ? (
                  <a onClick={() => publish(record.id)}>发布</a>
                ) : (
                  <a onClick={() => unpublish(record.id)}>下线</a>
                )}
                <Popconfirm title="确定删除？" onConfirm={() => remove(record.id)}>
                  <a style={{ color: '#ff4d4f' }}>删除</a>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </>
  );
}
```

- [ ] **Step 2: 创建博客编辑器组件（分屏预览）**

```tsx
// web/components/admin/blog-editor.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Space, message } from 'antd';
import { api } from '@/lib/api';
import { Markdown } from '@/components/markdown';
import type { Blog } from '@/lib/types';

export function BlogEditor({ initial }: { initial?: Blog }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [content, setContent] = useState(initial?.content || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        title: initial.title,
        slug: initial.slug,
        summary: initial.summary,
        tags: initial.tags.join(', '),
      });
    }
  }, [initial, form]);

  async function save(status: 'draft' | 'published') {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        title: values.title,
        slug: values.slug,
        summary: values.summary,
        tags: (values.tags as string).split(',').map((t) => t.trim()).filter(Boolean),
        content,
      };
      if (initial) {
        await api.admin.updateBlog(initial.id, payload);
        if (status === 'published' && initial.status !== 'published') {
          await api.admin.publishBlog(initial.id);
        } else if (status === 'draft' && initial.status === 'published') {
          await api.admin.unpublishBlog(initial.id);
        }
      } else {
        const created = await api.admin.createBlog(payload);
        if (status === 'published') await api.admin.publishBlog(created.id);
      }
      message.success(status === 'published' ? '已发布' : '已保存草稿');
      router.push('/admin/blogs');
    } catch (err: any) {
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ required: true }]}>
          <Input placeholder="文章标题" />
        </Form.Item>
        <Form.Item name="slug" label="slug" rules={[{ required: true }]}>
          <Input placeholder="url-friendly-slug" />
        </Form.Item>
        <Form.Item name="summary" label="摘要">
          <Input.TextArea rows={2} placeholder="一句话摘要" />
        </Form.Item>
        <Form.Item name="tags" label="标签（逗号分隔）">
          <Input placeholder="React, NestJS, Docker" />
        </Form.Item>
      </Form>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: 500 }}>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>正文（Markdown）</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: '100%', height: '100%', resize: 'none', fontFamily: 'monospace', padding: 12, borderRadius: 6, border: '1px solid #444', background: '#1f1f1f', color: '#eee' }}
          />
        </div>
        <div style={{ overflow: 'auto', border: '1px solid #444', borderRadius: 6, padding: 12 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>预览</div>
          <Markdown content={content} />
        </div>
      </div>

      <Space style={{ marginTop: 16 }}>
        <Button onClick={() => router.push('/admin/blogs')}>取消</Button>
        <Button loading={saving} onClick={() => save('draft')}>保存草稿</Button>
        <Button type="primary" loading={saving} onClick={() => save('published')}>发布</Button>
      </Space>
    </>
  );
}
```

- [ ] **Step 3: 创建编辑/新建页面**

```tsx
// web/app/admin/(protected)/blogs/[id]/edit/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Spin } from 'antd';
import { api } from '@/lib/api';
import { BlogEditor } from '@/components/admin/blog-editor';
import type { Blog } from '@/lib/types';

export default function EditBlogPage() {
  const params = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getBlogs().then((list) => {
      setBlog(list.find((b) => b.id === parseInt(params.id, 10)) || null);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) return <Spin />;
  if (!blog) return <p>文章不存在</p>;
  return (
    <>
      <h2 style={{ marginBottom: 16 }}>编辑文章</h2>
      <BlogEditor initial={blog} />
    </>
  );
}
```

```tsx
// web/app/admin/(protected)/blogs/new/page.tsx
'use client';
import { BlogEditor } from '@/components/admin/blog-editor';

export default function NewBlogPage() {
  return (
    <>
      <h2 style={{ marginBottom: 16 }}>新建文章</h2>
      <BlogEditor />
    </>
  );
}
```

- [ ] **Step 4: 验证 & 提交**

Run: `cd web ; npm run dev` → 登录后访问 /admin/blogs，新建/编辑/发布/删除
Run: `git add web/app/admin/\(protected\)/blogs/ web/components/admin/blog-editor.tsx && git commit -m "feat: add blog admin list and Markdown split-screen editor"`

---

### Task 26: 项目管理 `/admin/projects`（含拖拽排序）

**Files:**
- Create: `web/app/admin/(protected)/projects/page.tsx`
- Create: `web/components/admin/project-form.tsx`（Modal 表单 + 封面上传）

- [ ] **Step 1: 安装拖拽排序依赖**

Run: `cd web ; npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

- [ ] **Step 2: 创建项目表单组件（含上传）**

```tsx
// web/components/admin/project-form.tsx
'use client';
import { useEffect } from 'react';
import { Modal, Form, Input, Switch, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import type { Project } from '@/lib/types';

interface Props {
  open: boolean;
  initial?: Project | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProjectForm({ open, initial, onClose, onSaved }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        title: initial.title,
        slug: initial.slug,
        description: initial.description,
        content: initial.content,
        cover_url: initial.cover_url,
        tech_stack: initial.tech_stack.join(', '),
        demo_url: initial.demo_url,
        github_url: initial.github_url,
        is_visible: initial.is_visible,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ is_visible: true });
    }
  }, [initial, form, open]);

  async function uploadCover(file: File): Promise<string> {
    const res = await api.admin.uploadImage(file);
    form.setFieldValue('cover_url', res.url);
    return res.url;
  }

  async function submit() {
    const values = await form.validateFields();
    const payload = {
      ...values,
      tech_stack: (values.tech_stack as string).split(',').map((t: string) => t.trim()).filter(Boolean),
    };
    if (initial) {
      await api.admin.updateProject(initial.id, payload);
      message.success('已更新');
    } else {
      await api.admin.createProject(payload);
      message.success('已创建');
    }
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} title={initial ? '编辑项目' : '新建项目'} onOk={submit} onCancel={onClose} width={600}>
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="slug" label="slug" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="description" label="简介"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="content" label="详细描述（Markdown）"><Input.TextArea rows={4} /></Form.Item>
        <Form.Item name="tech_stack" label="技术栈（逗号分隔）"><Input placeholder="React, NestJS" /></Form.Item>
        <Form.Item name="demo_url" label="在线链接"><Input /></Form.Item>
        <Form.Item name="github_url" label="GitHub 链接"><Input /></Form.Item>
        <Form.Item name="cover_url" label="封面图 URL">
          <Input />
        </Form.Item>
        <Upload
          beforeUpload={(file) => { uploadCover(file); return false; }}
          showUploadList={false}
        >
          <a><UploadOutlined /> 上传封面</a>
        </Upload>
        <Form.Item name="is_visible" label="前台展示" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Modal>
  );
}
```

- [ ] **Step 3: 实现项目管理页（含拖拽排序）**

```tsx
// web/app/admin/(protected)/projects/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Table, Button, Space, Image, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api';
import { ProjectForm } from '@/components/admin/project-form';
import type { Project } from '@/lib/types';

function DraggableRow(props: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  });
  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    background: isDragging ? '#e6f4ff' : undefined,
  };
  return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />;
}

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function load() {
    setLoading(true);
    setProjects(await api.admin.getProjects());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: number) {
    await api.admin.deleteProject(id);
    message.success('已删除'); load();
  }

  async function onDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = projects.findIndex((p) => p.id === active.id);
    const newIdx = projects.findIndex((p) => p.id === over.id);
    const next = arrayMove(projects, oldIdx, newIdx);
    setProjects(next);
    // 立即同步排序到后端
    await api.admin.reorderProjects(next.map((p, idx) => ({ id: p.id, sort_order: idx })));
    message.success('排序已保存');
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>项目管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true); }}>新建项目</Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={projects}
            components={{ body: { row: DraggableRow } }}
            columns={[
              {
                title: '封面', dataIndex: 'cover_url', width: 100,
                render: (url?: string) => url ? <Image src={url} width={80} /> : '-',
              },
              { title: '标题', dataIndex: 'title' },
              {
                title: '技术栈', dataIndex: 'tech_stack',
                render: (ts: string[]) => ts.slice(0, 3).map((t) => <Tag key={t}>{t}</Tag>),
              },
              {
                title: '展示', dataIndex: 'is_visible',
                render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>,
              },
              {
                title: '操作', render: (_, record) => (
                  <Space>
                    <a onClick={() => { setEditing(record); setModalOpen(true); }}>编辑</a>
                    <Popconfirm title="确定删除？" onConfirm={() => remove(record.id)}>
                      <a style={{ color: '#ff4d4f' }}>删除</a>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </SortableContext>
      </DndContext>

      <ProjectForm open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSaved={load} />
    </>
  );
}
```

- [ ] **Step 4: 验证 & 提交**

Run: `cd web ; npm run dev` → 登录后访问 /admin/projects，新建/编辑/拖拽排序/删除
Run: `git add web/app/admin/\(protected\)/projects/ web/components/admin/project-form.tsx web/package.json && git commit -m "feat: add project admin with drag-sortable table and cover upload"`

---

### Task 27: 个人信息 `/admin/profile`

**Files:**
- Create: `web/app/admin/(protected)/profile/page.tsx`

- [ ] **Step 1: 实现个人信息编辑页**

```tsx
// web/app/admin/(protected)/profile/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Form, Input, Button, message, Spin, Divider } from 'antd';
import { api } from '@/lib/api';
import type { Profile } from '@/lib/types';

export default function ProfileAdminPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.admin.getProfile().then((p) => {
      form.setFieldsValue({
        name: p.name,
        title: p.title,
        bio: p.bio,
        about: p.about,
        avatar_url: p.avatar_url,
        github: p.social_links?.github,
        linkedin: p.social_links?.linkedin,
        email: p.social_links?.email,
        twitter: p.social_links?.twitter,
      });
      setLoading(false);
    });
  }, [form]);

  async function save() {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await api.admin.updateProfile({
        name: v.name,
        title: v.title,
        bio: v.bio,
        about: v.about,
        avatar_url: v.avatar_url,
        social_links: {
          github: v.github, linkedin: v.linkedin, email: v.email, twitter: v.twitter,
        },
      });
      message.success('已保存');
    } catch (err: any) {
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spin />;

  return (
    <>
      <h2 style={{ marginBottom: 16 }}>个人信息</h2>
      <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="title" label="职位标题" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="bio" label="一句话介绍"><Input /></Form.Item>
        <Form.Item name="avatar_url" label="头像 URL"><Input /></Form.Item>
        <Form.Item name="about" label="详细介绍（Markdown）"><Input.TextArea rows={6} /></Form.Item>

        <Divider>社交链接</Divider>
        <Form.Item name="github" label="GitHub"><Input /></Form.Item>
        <Form.Item name="linkedin" label="LinkedIn"><Input /></Form.Item>
        <Form.Item name="email" label="Email"><Input /></Form.Item>
        <Form.Item name="twitter" label="Twitter"><Input /></Form.Item>

        <Button type="primary" loading={saving} onClick={save}>保存</Button>
      </Form>
      <p style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
        注：技能、工作经历、教育背景等复杂数组字段可通过数据库直接编辑或后续扩展管理界面。
      </p>
    </>
  );
}
```

- [ ] **Step 2: 验证 & 提交**

Run: `cd web ; npm run dev` → 登录后访问 /admin/profile，编辑并保存
Run: `git add web/app/admin/\(protected\)/profile/ && git commit -m "feat: add profile admin edit page"`

---

### Task 28: 访客统计 `/admin/analytics`

**Files:**
- Create: `web/app/admin/(protected)/analytics/page.tsx`

- [ ] **Step 1: 实现访客统计页**

```tsx
// web/app/admin/(protected)/analytics/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { api } from '@/lib/api';
import { PvLine } from '@/components/charts/pv-line';
import type { Analytics } from '@/lib/types';

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getAnalytics().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <Spin />;

  const monthData = (data?.dailyStats ?? []).map((s) => ({ date: s.date.slice(5), pv: s.pv }));

  return (
    <>
      <h2 style={{ marginBottom: 16 }}>访客统计</h2>
      <Row gutter={[16, 16]}>
        <Col span={6}><Card><Statistic title="总访问量" value={data?.totalPv ?? 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="今日 PV" value={data?.todayPv ?? 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="本周 PV" value={data?.weekPv ?? 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="本月 PV" value={data?.monthPv ?? 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="在线人数" value={data?.online ?? 0} /></Card></Col>
      </Row>

      <Card title="最近 30 天 PV" style={{ marginTop: 16 }}>
        {monthData.length > 0 ? <PvLine data={monthData} /> : <p>暂无数据</p>}
      </Card>
    </>
  );
}
```

- [ ] **Step 2: 验证 & 提交**

Run: `cd web ; npm run dev` → 登录后访问 /admin/analytics
Run: `git add web/app/admin/\(protected\)/analytics/ && git commit -m "feat: add analytics page with 30-day PV chart"`

---

## Phase 7: SEO

### Task 29: Sitemap、Robots 与 Open Graph 元数据

**Files:**
- Create: `web/app/sitemap.ts`
- Create: `web/app/robots.ts`
- Modify: `web/app/layout.tsx`（增强 OG metadata）

- [ ] **Step 1: 创建动态 sitemap**

```typescript
// web/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ['', '/about', '/projects', '/blog', '/contact'].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }));

  const [projects, blogs] = await Promise.all([
    api.getProjects().catch(() => []),
    api.getBlogs(1, 100).then((r) => r.items).catch(() => []),
  ]);

  const projectPages = projects.map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const blogPages = blogs.map((b) => ({
    url: `${SITE_URL}/blog/${b.slug}`,
    lastModified: new Date(b.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...projectPages, ...blogPages];
}
```

- [ ] **Step 2: 创建 robots.txt**

```typescript
// web/app/robots.ts
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: 增强 layout.tsx 的 Open Graph 与 canonical**

```tsx
// web/app/layout.tsx — 替换 metadata 部分
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Your Name | Full-Stack Developer',
    template: '%s | Your Name',
  },
  description: '个人作品集与博客',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
    siteName: 'Your Name',
    title: 'Your Name | Full-Stack Developer',
    description: '个人作品集与博客',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Name | Full-Stack Developer',
    description: '个人作品集与博客',
  },
};
```

- [ ] **Step 4: 验证 & 提交**

Run: `cd web ; npm run dev`
Expected: 访问 /sitemap.xml 返回动态生成的 sitemap；/robots.txt 返回 robots 配置

Run: `git add web/app/sitemap.ts web/app/robots.ts web/app/layout.tsx && git commit -m "feat: add dynamic sitemap, robots.txt, and OG metadata"`

---

### Task 30: GEO（生成式引擎优化）— JSON-LD 结构化数据 + llms.txt

> **GEO（Generative Engine Optimization）** 是面向 AI 搜索引擎（ChatGPT、Perplexity、Claude 等）的优化技术，让 AI 更容易提取、理解和引用网站内容。三大手段：① JSON-LD 结构化数据（schema.org）；② llms.txt（给 LLM 读的内容摘要）；③ 语义化 HTML。

**Files:**
- Create: `web/components/json-ld.tsx`（通用 JSON-LD 注入组件）
- Create: `web/app/llms.txt/route.ts`（生成 llms.txt）
- Modify: `web/app/layout.tsx`（注入 WebSite + Person schema）
- Modify: `web/app/page.tsx`（首页补充 Person schema）
- Modify: `web/app/blog/[slug]/page.tsx`（文章页 BlogPosting schema + BreadcrumbList）
- Modify: `web/app/projects/[slug]/page.tsx`（项目页 CreativeWork schema）

**Interfaces:**
- Consumes: `api.getProfile`、`api.getBlog`、`api.getProject`
- Produces: 每个页面 `<script type="application/ld+json">` 注入对应 schema
- Produces: `/llms.txt` 文本响应

- [ ] **Step 1: 创建通用 JSON-LD 组件**

```tsx
// web/components/json-ld.tsx
// 在页面 <head> 中注入结构化数据。Server Component 中使用。
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
```

- [ ] **Step 2: 在根布局注入 WebSite schema（站点级搜索框）**

在 `web/app/layout.tsx` 中，先拉取 profile（用于站点名/作者），再在 `<body>` 内顶部注入 `WebSite` schema。更新后的 layout.tsx 关键部分：

```tsx
// web/app/layout.tsx — 在已有 metadata 后新增
import { api } from '@/lib/api';
import { JsonLd } from '@/components/json-ld';

// ... 保留原 metadata

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await api.getProfile().catch(() => null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: profile?.name || 'Your Name',
    url: siteUrl,
    description: profile?.bio || '个人作品集与博客',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/blog?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <JsonLd data={websiteSchema} />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <VisitTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 在首页注入 Person schema**

在 `web/app/page.tsx` 的 `<>` 内、`<SiteHeader />` 之前加入：

```tsx
// web/app/page.tsx — 在组件顶部导入 JsonLd，并在返回的 JSX 顶部插入
import { JsonLd } from '@/components/json-ld';

// 在 return 的 <> 之后、<SiteHeader /> 之前：
{profile && (
  <JsonLd
    data={{
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.name,
      jobTitle: profile.title,
      description: profile.bio,
      url: process.env.NEXT_PUBLIC_SITE_URL,
      image: profile.avatar_url,
      sameAs: [
        profile.social_links?.github,
        profile.social_links?.linkedin,
        profile.social_links?.twitter,
      ].filter(Boolean),
      knowsAbout: profile.skills?.map((s) => s.name),
    }}
  />
)}
```

- [ ] **Step 4: 在博客详情页注入 BlogPosting + BreadcrumbList schema**

修改 `web/app/blog/[slug]/page.tsx`，在 `<SiteHeader />` 之前加入：

```tsx
// web/app/blog/[slug]/page.tsx — 顶部导入
import { JsonLd } from '@/components/json-ld';

// 在 return 的 <> 之后、<SiteHeader /> 之前：
{blog && (
  <>
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blog.title,
        description: blog.summary,
        datePublished: blog.published_at,
        dateModified: blog.updated_at,
        articleBody: blog.content,
        keywords: blog.tags,
        author: { '@type': 'Person', name: 'Your Name' },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${blog.slug}`,
        },
      }}
    />
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: process.env.NEXT_PUBLIC_SITE_URL },
          { '@type': 'ListItem', position: 2, name: '博客', item: `${process.env.NEXT_PUBLIC_SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: blog.title },
        ],
      }}
    />
  </>
)}
```

- [ ] **Step 5: 在项目详情页注入 CreativeWork schema**

修改 `web/app/projects/[slug]/page.tsx`，在 `<SiteHeader />` 之前加入：

```tsx
// web/app/projects/[slug]/page.tsx — 顶部导入
import { JsonLd } from '@/components/json-ld';

// 在 return 的 <> 之后、<SiteHeader /> 之前：
{project && (
  <JsonLd
    data={{
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      description: project.description,
      about: project.content,
      keywords: project.tech_stack,
      author: { '@type': 'Person', name: 'Your Name' },
      url: project.demo_url,
      codeRepository: project.github_url,
      image: project.cover_url,
    }}
  />
)}
```

- [ ] **Step 6: 创建 llms.txt（AI 友好的站点摘要）**

> **llms.txt** 是一种新兴约定（类似 robots.txt），向 LLM 提供站点的高层摘要与可读内容入口，便于 AI 检索和引用。

```typescript
// web/app/llms.txt/route.ts
import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const profile = await api.getProfile().catch(() => null);
  const projects = await api.getProjects().catch(() => []);
  const blogs = await api.getBlogs(1, 10).then((r) => r.items).catch(() => []);

  const name = profile?.name || 'Your Name';
  const title = profile?.title || 'Full-Stack Developer';
  const bio = profile?.bio || '';

  const lines: string[] = [
    `# ${name}`,
    '',
    `> ${title}`,
    bio ? '' : '',
    bio,
    '',
    '## 关于',
    `本站是 ${name} 的个人作品集与技术博客，包含项目作品、技术文章与联系方式。`,
    '',
    '## 项目作品',
    ...projects.slice(0, 5).map(
      (p) => `- [${p.title}](${siteUrl}/projects/${p.slug}): ${p.description || ''}`,
    ),
    '',
    '## 最新博客',
    ...blogs.map(
      (b) => `- [${b.title}](${siteUrl}/blog/${b.slug}): ${b.summary || ''}`,
    ),
    '',
    '## 链接',
    `- 首页: ${siteUrl}`,
    `- 项目: ${siteUrl}/projects`,
    `- 博客: ${siteUrl}/blog`,
    `- 联系: ${siteUrl}/contact`,
  ];

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  });
}
```

- [ ] **Step 7: 在 robots.txt 中放行 llms.txt（已在 Task 29 allow / 覆盖，无需改动）**

确认 `web/app/robots.ts` 的 `allow: '/'` 已覆盖 `/llms.txt`，无需额外配置。

- [ ] **Step 8: 验证结构化数据**

Run: `cd web ; npm run dev`
验证步骤：
1. 访问 http://localhost:3000，浏览器查看源码，`<script type="application/ld+json">` 包含 `WebSite` 和 `Person`
2. 访问任意博客详情页，源码包含 `BlogPosting` 和 `BreadcrumbList`
3. 访问 http://localhost:3000/llms.txt，返回纯文本摘要
4. 复制源码中的 JSON-LD，粘贴到 https://search.google.com/test/rich-results 验证（可选）

- [ ] **Step 9: 提交**

Run: `git add web/components/json-ld.tsx web/app/llms.txt/ web/app/layout.tsx web/app/page.tsx web/app/blog/\[slug\]/page.tsx web/app/projects/\[slug\]/page.tsx && git commit -m "feat: add GEO with JSON-LD structured data and llms.txt for AI search engines"`

---

## Phase 8: 部署与上线配置

### Task 31: 生产配置（Next.js Config、CORS、Docker Compose 生产版、Vercel）

**Files:**
- Create: `web/next.config.js`（覆盖默认，配置 Image 域名 + 输出优化）
- Create: `web/.env.example`
- Modify: `server/src/main.ts`（生产 Cookie secure）
- Modify: `docker-compose.yml`（添加生产环境 restart / healthcheck）
- Create: `web/.vercelignore`（可选，忽略测试文件）

- [ ] **Step 1: 配置 Next.js（Image 远程域名白名单）**

```javascript
// web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // 允许后端 /uploads 目录与 GitHub 头像
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3001' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '**' }, // 上线时收紧为你的 API 域名
    ],
  },
};
module.exports = nextConfig;
```

> 说明：项目里直接用了 `<img>`，Image 组件为后续优化预留；若改用 `next/image`，remotePatterns 即生效。

- [ ] **Step 2: 创建前端环境变量模板**

```env
# web/.env.example
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 3: 加固后端 Cookie（生产环境强制 Secure）**

检查 `server/src/modules/auth/auth.controller.ts` 中 Cookie 配置已使用：
```typescript
secure: process.env.NODE_ENV === 'production',
sameSite: 'lax',
```
确认无误即可（Task 6 已实现）。

- [ ] **Step 4: 升级 docker-compose.yml 为生产可用**

```yaml
# docker-compose.yml — 生产版（覆盖原文件）
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-portfolio}
      POSTGRES_USER: ${DATABASE_USER:-postgres}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-postgres}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data

  server:
    build: ./server
    restart: unless-stopped
    ports:
      - '3001:3001'
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./uploads:/app/uploads

volumes:
  pgdata:
  redisdata:
```

- [ ] **Step 5: 配置生产环境变量（.env.production 模板）**

```env
# .env.production（参考，实际通过服务器环境变量注入）
NODE_ENV=production
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=portfolio
DATABASE_USER=postgres
DATABASE_PASSWORD=__STRONG_PASSWORD__

REDIS_HOST=redis
REDIS_PORT=6379

JWT_SECRET=__RANDOM_64_CHAR_SECRET__
JWT_EXPIRES_IN=7d

GITHUB_CLIENT_ID=__YOUR_ID__
GITHUB_CLIENT_SECRET=__YOUR_SECRET__
GITHUB_CALLBACK_URL=https://api.your-domain.com/api/auth/github/callback
ALLOWED_GITHUB_IDS=__YOUR_GITHUB_ID__

FRONTEND_URL=https://your-domain.com
```

- [ ] **Step 6: Vercel 部署前端**

1. 将仓库推送到 GitHub
2. 登录 https://vercel.com → New Project → 导入仓库
3. 配置：
   - Root Directory: `web`
   - Framework Preset: Next.js
   - Environment Variables:
     - `NEXT_PUBLIC_API_URL` = `https://api.your-domain.com`
     - `NEXT_PUBLIC_SITE_URL` = `https://your-domain.com`
4. Deploy

- [ ] **Step 7: 服务器部署后端**

```bash
# 在服务器上
git clone <repo> && cd portfolio
cp .env.example .env  # 编辑生产变量
docker-compose up -d --build
```

验证：
- `https://api.your-domain.com/api/profile` 返回 JSON
- 前端能正常 OAuth 登录

- [ ] **Step 8: 提交部署配置**

Run: `git add web/next.config.js web/.env.example docker-compose.yml && git commit -m "chore: add production deployment configuration"`

---

## 总结

本计划共 8 个 Phase、31 个 Task，覆盖：

| Phase | 内容 | Task |
|-------|------|------|
| 1 | 项目脚手架与后端基础 | 1-5 |
| 2 | 认证系统 | 6-7 |
| 3 | 后端业务模块 | 8-14 |
| 4 | 前端基础 | 15-16 |
| 5 | 前台公开页面 | 17-22 |
| 6 | 管理后台 | 23-28 |
| 7 | SEO + GEO（生成式引擎优化） | 29-30 |
| 8 | 部署 | 31 |

**技术栈覆盖验证**（对照需求文档第 13 节）：

| 学习的技术 | 本计划中的实现 |
|------------|---------------|
| Node.js | NestJS 运行时（Task 3） |
| npm | 前后端包管理（Task 2/3） |
| Next.js App Router | 所有页面路由（Phase 4-7） |
| SEO (sitemap) | `web/app/sitemap.ts`（Task 29） |
| Geo（生成式引擎优化） | JSON-LD 结构化数据（WebSite/Person/BlogPosting/CreativeWork）+ `llms.txt`（Task 30） |
| robots.txt | `web/app/robots.ts`（Task 29） |
| React | 所有 UI 组件 |
| Vercel | 前端部署（Task 31 Step 6） |
| Tailwind CSS | 前台样式（Task 16） |
| 响应式布局 | 所有页面移动端适配（md/lg 断点） |
| Docker | 后端 + PG + Redis 容器化（Task 4/31） |
| Redis | 访客计数 + 缓存 + OAuth state（Task 5/12/14） |
| PostgreSQL | 业务数据持久化（Task 5） |
| OAuth2 | GitHub 第三方登录（Task 6） |
| JWT 鉴权 | HttpOnly Cookie + Guard（Task 6） |
| NestJS | 后端 RESTful API（Phase 2-3） |
| Ant Design | 管理后台 UI（Phase 6） |