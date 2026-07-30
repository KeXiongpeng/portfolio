import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    await this.warnIfNoAdmin();
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

  /** 无管理员时打印提示（不自动创建，改由 npm run create-admin 脚本创建） */
  private async warnIfNoAdmin() {
    const superRole = await this.roleRepo.findOne({ where: { name: 'super_admin' } });
    const fallbackAdmin = await this.roleRepo.findOne({ where: { name: 'admin' } });
    const roleId = superRole?.id || fallbackAdmin?.id;
    if (!roleId) return; // 角色尚未初始化，下次启动再提示

    const existing = await this.userRepo.findOne({ where: { role_id: roleId } });
    if (!existing) {
      this.logger.warn(
        '未检测到管理员账号。请在 server 目录运行 `npm run create-admin` 创建首个管理员。',
      );
    }
  }
}
