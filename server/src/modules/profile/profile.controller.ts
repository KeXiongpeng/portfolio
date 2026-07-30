import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

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

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Put('admin/profile')
  updateProfile(@Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(dto);
  }
}
