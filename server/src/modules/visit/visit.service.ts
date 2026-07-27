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
