import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../../entities';
import { RedisService } from '../../redis';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepo: Repository<Profile>,
    private redisService: RedisService,
  ) {}

  async getPublicProfile() {
    const cached = await this.redisService.get('cache:profile');
    if (cached) return JSON.parse(cached);

    let profile = await this.profileRepo.findOne({ where: { id: 1 } });
    if (!profile) {
      profile = this.profileRepo.create({
        name: 'Your Name',
        title: 'Full-Stack Developer',
        bio: 'A passionate developer',
      });
      profile = await this.profileRepo.save(profile);
    }
    await this.redisService.set('cache:profile', JSON.stringify(profile), 600);
    return profile;
  }

  async getAdminProfile() {
    return this.getPublicProfile();
  }

  async updateProfile(dto: UpdateProfileDto) {
    let profile = await this.profileRepo.findOne({ where: { id: 1 } });
    if (!profile) {
      profile = this.profileRepo.create(dto as any) as any;
    } else {
      Object.assign(profile, dto);
    }
    profile = await this.profileRepo.save(profile);
    await this.redisService.del('cache:profile');
    return profile;
  }
}
