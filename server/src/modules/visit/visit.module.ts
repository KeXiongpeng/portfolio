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
