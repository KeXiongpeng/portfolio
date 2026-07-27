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
