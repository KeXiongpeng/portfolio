import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Public()
  @Get('profile')
  getProfile() {
    return this.profileService.getPublicProfile();
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/profile')
  getAdminProfile() {
    return this.profileService.getAdminProfile();
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/profile')
  updateProfile(@Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(dto);
  }
}
