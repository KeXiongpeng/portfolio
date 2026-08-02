import { join } from 'path';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';

// 仅本地开发加载.env;Vercel会自动注入环境变量
if (process.env.NODE_ENV !== 'production') {
  // 优先加载 .env.local(本地开发),如果不存在则加载 .env
  const envLocalPath = join(process.cwd(), '..', '.env.local');
  const envPath = join(process.cwd(), '..', '.env');

  if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  } else {
    dotenv.config({ path: envPath });
  }
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
