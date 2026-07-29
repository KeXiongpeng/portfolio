// server/api/index.ts
// 将 NestJS 应用包装为 Vercel Serverless Function
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import serverlessExpress from '@codegenie/serverless-express';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import * as cookieParser from 'cookie-parser';

let cachedServer: ReturnType<typeof serverlessExpress>;

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

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  return cachedServer(req, res);
}
