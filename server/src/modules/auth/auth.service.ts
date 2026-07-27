// server/src/modules/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities';
import { RedisService } from '../../redis';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async validateGithubUser(githubId: number, username: string, avatarUrl: string): Promise<User | null> {
    const allowedIds = (process.env.ALLOWED_GITHUB_IDS || '').split(',').map(Number);
    if (!allowedIds.includes(githubId)) return null;

    let user = await this.userRepo.findOne({ where: { github_id: githubId } });
    if (!user) {
      user = this.userRepo.create({ github_id: githubId, username, avatar_url: avatarUrl });
      user = await this.userRepo.save(user);
    } else {
      user.avatar_url = avatarUrl;
      user.username = username;
      user = await this.userRepo.save(user);
    }
    return user;
  }

  async generateToken(user: User): Promise<string> {
    const payload = { sub: user.id, githubId: user.github_id, username: user.username, role: user.role };
    return this.jwtService.sign(payload);
  }

  async generateState(): Promise<string> {
    const state = Math.random().toString(36).substring(2, 15);
    await this.redisService.set(`oauth:state:${state}`, '1', 600);
    return state;
  }

  async validateState(state: string): Promise<boolean> {
    const value = await this.redisService.get(`oauth:state:${state}`);
    if (!value) return false;
    await this.redisService.del(`oauth:state:${state}`);
    return true;
  }
}
