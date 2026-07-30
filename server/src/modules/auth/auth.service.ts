// server/src/modules/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Role, Account } from '../../entities';
import { RedisService } from '../../redis';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  /** 账号密码注册 */
  async register(username: string, password: string, email: string): Promise<{ token: string }> {
    // 检查用户名是否已被 local 账号占用
    const existing = await this.accountRepo.findOne({
      where: { provider: 'local', provider_user_id: username },
    });
    if (existing) throw new ConflictException('用户名已存在');

    // 获取默认 user 角色
    const userRole = await this.roleRepo.findOne({ where: { name: 'user' } });
    if (!userRole) throw new Error('默认角色不存在，请先初始化角色数据');

    // 创建用户
    const user = this.userRepo.create({
      username,
      email,
      role_id: userRole.id,
    });
    const savedUser = await this.userRepo.save(user);

    // 创建 local 账号凭据
    const passwordHash = await bcrypt.hash(password, 10);
    const account = this.accountRepo.create({
      user_id: savedUser.id,
      provider: 'local',
      provider_user_id: username,
      password_hash: passwordHash,
    });
    await this.accountRepo.save(account);

    const token = await this.generateToken(savedUser);
    return { token };
  }

  /** 账号密码登录校验 */
  async validateLocalUser(username: string, password: string): Promise<User> {
    const account = await this.accountRepo.findOne({
      where: { provider: 'local', provider_user_id: username },
    });
    if (!account) throw new UnauthorizedException('用户名或密码错误');

    const isMatch = await bcrypt.compare(password, account.password_hash);
    if (!isMatch) throw new UnauthorizedException('用户名或密码错误');

    const user = await this.userRepo.findOne({ where: { id: account.user_id } });
    if (!user) throw new UnauthorizedException('用户不存在');
    return user;
  }

  /** GitHub 用户校验（白名单内自动 admin） */
  async validateGithubUser(githubId: number | string, username: string, avatarUrl: string): Promise<User | null> {
    const numericId = Number(githubId);
    const providerUserId = String(numericId);

    // 查找已有的 github 账号
    let account = await this.accountRepo.findOne({
      where: { provider: 'github', provider_user_id: providerUserId },
    });

    if (account) {
      // 已存在，更新头像和用户名
      const user = await this.userRepo.findOne({ where: { id: account.user_id } });
      if (user) {
        user.avatar_url = avatarUrl;
        user.username = username;
        await this.userRepo.save(user);
        return user;
      }
    }

    // 白名单检查
    const allowedIds = (process.env.ALLOWED_GITHUB_IDS || '').split(',').map(Number);
    const isWhitelisted = allowedIds.includes(numericId);

    // 确定角色
    let roleId: number;
    if (isWhitelisted) {
      const adminRole = await this.roleRepo.findOne({ where: { name: 'admin' } });
      roleId = adminRole?.id;
    } else {
      const userRole = await this.roleRepo.findOne({ where: { name: 'user' } });
      roleId = userRole?.id;
    }
    if (!roleId) throw new Error('角色数据未初始化');

    // 创建新用户 + github 账号
    const user = this.userRepo.create({
      username,
      avatar_url: avatarUrl,
      role_id: roleId,
    });
    const savedUser = await this.userRepo.save(user);

    account = this.accountRepo.create({
      user_id: savedUser.id,
      provider: 'github',
      provider_user_id: providerUserId,
    });
    await this.accountRepo.save(account);

    return savedUser;
  }

  /** 根据 role_id 查询角色名 */
  async getRoleName(roleId: number | null): Promise<string> {
    if (!roleId) return 'user';
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    return role?.name || 'user';
  }

  /** 签发 JWT */
  async generateToken(user: User): Promise<string> {
    const role = await this.getRoleName(user.role_id);
    const payload = { sub: user.id, username: user.username, role };
    return this.jwtService.sign(payload);
  }

  /** 刷新 token（从 DB 重新加载用户角色，避免角色丢失） */
  async refreshToken(userId: number): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    return this.generateToken(user);
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
