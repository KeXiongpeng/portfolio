import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { VisitService } from './visit.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api')
export class VisitController {
  constructor(private visitService: VisitService) {}

  @Public()
  @Get('visit/count')
  getCount() {
    return this.visitService.getPublicCount();
  }

  @Public()
  @Post('visit/track')
  track(@Body('fingerprint') fingerprint: string) {
    return this.visitService.trackVisit(fingerprint || 'anonymous');
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/analytics')
  getAnalytics() {
    return this.visitService.getAnalytics();
  }
}
