// server/api/cron.ts
// Vercel Cron 调用的接口，执行访问统计持久化（替代本地 @nestjs/schedule 的定时任务）
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { VisitCron } from '../src/modules/visit/visit.cron';

export default async function handler(req: any, res: any) {
  // 仅允许 Vercel Cron 调用（通过 Authorization 头校验，CRON_SECRET 在 Vercel 环境变量配置）
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const visitCron = app.get(VisitCron);
    // 调用原有的持久化方法：将当日 Redis 计数写入 PostgreSQL
    await visitCron.persistDailyStats();
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  } finally {
    await app.close();
  }
}
