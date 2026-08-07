// server/src/app.module.ts — 更新后
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import * as entities from './entities';
import { RedisModule } from './redis';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ProjectModule } from './modules/project/project.module';
import { BlogModule } from './modules/blog/blog.module';
import { ContactModule } from './modules/contact/contact.module';
import { VisitModule } from './modules/visit/visit.module';
import { UploadModule } from './modules/upload/upload.module';
import { JwtAuthGuard } from './common/guards/jwt.guard';
import { RolesGuard } from './common/guards/roles.guard';

const entityList = Object.values(entities);

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'portfolio',
        // 生产环境连接 Neon/Supabase 需要 SSL
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        entities: entityList,
        // 生产环境默认不自动建表；通过 SYNC_DB=true 可临时开启（首次部署建表用）
        synchronize: process.env.NODE_ENV !== 'production' || process.env.SYNC_DB === 'true',
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    RedisModule,
    AuthModule,
    ProfileModule,
    ProjectModule,
    BlogModule,
    ContactModule,
    VisitModule,
    UploadModule,
  ],
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
})
export class AppModule {}
