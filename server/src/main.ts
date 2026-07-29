import { join } from 'path';
import * as dotenv from 'dotenv';
// 加载项目根目录的 .env 文件（本地开发用；Docker 部署时 env_file 已注入）
//dotenv.config({ path: join(process.cwd(), '..', '.env') });

// 仅本地开发加载.env;Vercel会自动注入环境变量
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config({ path: join(process.cwd(), '..', '.env') });
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(3001);
  console.log('Server running on http://localhost:3001');
}
bootstrap();
