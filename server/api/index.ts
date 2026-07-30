// server/api/index.ts
// 将 NestJS 应用包装为 Vercel Serverless Function
// 显式 import pg，强制 Vercel 打包器包含数据库驱动（否则 tree-shaking 会丢失）
import 'pg';
import 'ioredis';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { Express } from 'express';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import cookieParser from 'cookie-parser';

let cachedApp: Express;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  // CORS 在此处配置（替代 main.ts）
  const corsOrigin = process.env.FRONTEND_URL || '*';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  // 直接返回 Express 实例（Vercel Node 运行时原生兼容 Express 的 req/res）
  return app.getHttpAdapter().getInstance() as Express;
}

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  // 直接把请求交给 Express 处理（@vercel/node 的 req/res 与 Express 兼容）
  cachedApp(req, res);
}
