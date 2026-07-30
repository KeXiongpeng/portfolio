import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role, User, Account } from '../../entities';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Account) private accountRepo: Repository<Account>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedRoles();
    await this.migrateOldGithubUsers();
    await this.seedInitialAdmin();
  }

  /** 初始化默认角色 */
  private async seedRoles() {
    const defaults = [
      { name: 'user', description: '普通用户' },
      { name: 'admin', description: '管理员' },
      { name: 'super_admin', description: '超级管理员' },
    ];
    for (const r of defaults) {
      const exists = await this.roleRepo.findOne({ where: { name: r.name } });
      if (!exists) {
        await this.roleRepo.save(this.roleRepo.create(r));
        this.logger.log(`已创建角色: ${r.name}`);
      }
    }
  }

  /** 迁移旧 users 表中的 github_id 到 accounts 表 */
  private async migrateOldGithubUsers() {
    // 检查 users 表是否还有 github_id 列（旧结构）
    try {
      const rows: any[] = await this.userRepo.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'github_id'`,
      );
      if (rows.length === 0) return; // 已迁移，无此列

      this.logger.log('检测到旧 github_id 列，开始迁移...');
      const oldUsers: any[] = await this.userRepo.query(
        `SELECT id, github_id, username, avatar_url FROM users WHERE github_id IS NOT NULL`,
      );

      // 获取 admin 角色用于白名单用户
      const adminRole = await this.roleRepo.findOne({ where: { name: 'admin' } });

      for (const old of oldUsers) {
        const providerUserId = String(old.github_id);
        const existing = await this.accountRepo.findOne({
          where: { provider: 'github', provider_user_id: providerUserId },
        });
        if (!existing) {
          await this.accountRepo.save(
            this.accountRepo.create({
              user_id: old.id,
              provider: 'github',
              provider_user_id: providerUserId,
            }),
          );
          // 设置 role_id（白名单用户为 admin）
          const allowedIds = (process.env.ALLOWED_GITHUB_IDS || '').split(',').map(Number);
          const roleId = allowedIds.includes(Number(old.github_id)) ? adminRole?.id : null;
          await this.userRepo.update(old.id, { role_id: roleId } as any);
        }
      }

      // 删除旧的 github_id 列
      await this.userRepo.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "github_id"`);
      this.logger.log('迁移完成，已删除 github_id 列');
    } catch (err) {
      this.logger.warn(`迁移检查跳过: ${(err as Error).message}`);
    }
  }

  /** 初始管理员引导（仅首次） */
  private async seedInitialAdmin() {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@localhost';

    if (!adminUsername || !adminPassword) {
      this.logger.log('未配置 ADMIN_USERNAME/ADMIN_PASSWORD，跳过初始管理员创建');
      return;
    }

    // 检查是否已存在管理员
    const adminRole = await this.roleRepo.findOne({ where: { name: 'admin' } });
    if (!adminRole) return;
    const existingAdmin = await this.userRepo.findOne({ where: { role_id: adminRole.id } });
    if (existingAdmin) return;

    // 检查用户名是否已被占用
    const existingAccount = await this.accountRepo.findOne({
      where: { provider: 'local', provider_user_id: adminUsername },
    });
    if (existingAccount) {
      this.logger.warn(`用户名 ${adminUsername} 已存在，跳过管理员创建`);
      return;
    }

    // 使用 super_admin 角色
    const superRole = await this.roleRepo.findOne({ where: { name: 'super_admin' } });
    const roleId = superRole?.id || adminRole.id;

    const user = this.userRepo.create({
      username: adminUsername,
      email: adminEmail,
      role_id: roleId,
    });
    const savedUser = await this.userRepo.save(user);

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await this.accountRepo.save(
      this.accountRepo.create({
        user_id: savedUser.id,
        provider: 'local',
        provider_user_id: adminUsername,
        password_hash: passwordHash,
      }),
    );

    this.logger.log(`已创建初始管理员账号: ${adminUsername}`);
  }
}
