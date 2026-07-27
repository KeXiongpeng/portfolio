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
