// server/src/scripts/create-admin.ts
// 交互式创建管理员账号。用法：npm run create-admin
// 连生产 DB 时：在 server/.env 临时填入生产 DATABASE_*，跑完即删
import 'dotenv/config';
import * as readline from 'readline';
import * as bcrypt from 'bcryptjs';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../app.module';
import { User, Account, Role } from '../entities';

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));
}

/** 掩码输入密码（回显 *，支持退格/Ctrl+C） */
function askPassword(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let pw = '';
    stdout.write(prompt);
    if (stdin.isTTY) stdin.setRawMode(true);

    const onData = (ch: Buffer) => {
      const c = ch.toString();
      // Ctrl+C
      if (c === '\u0003') {
        stdout.write('\n');
        process.exit(0);
      }
      // 回车
      if (c === '\r' || c === '\n') {
        stdout.write('\n');
        cleanup();
        resolve(pw);
        return;
      }
      // 退格
      if (c === '\u007F' || c === '\b') {
        if (pw.length > 0) {
          pw = pw.slice(0, -1);
          stdout.write('\b \b');
        }
        return;
      }
      // 普通字符
      pw += c;
      stdout.write('*');
    };

    function cleanup() {
      stdin.removeListener('data', onData);
      if (stdin.isTTY) stdin.setRawMode(false);
    }

    stdin.on('data', onData);
  });
}

async function main() {
  console.log('\n=== 创建管理员账号 ===\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const userRepo: any = app.get(getRepositoryToken(User) as any);
    const accountRepo: any = app.get(getRepositoryToken(Account) as any);
    const roleRepo: any = app.get(getRepositoryToken(Role) as any);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const username = (await ask(rl, '用户名 [admin]: ')) || 'admin';
    const email = (await ask(rl, '邮箱 [admin@localhost]: ')) || 'admin@localhost';

    // 密码输入 + 校验
    let password: string;
    while (true) {
      password = await askPassword(rl, '密码 (至少 8 位): ');
      if (password.length < 8) {
        console.log('✗ 密码长度不足 8 位，请重试');
        continue;
      }
      const confirm = await askPassword(rl, '确认密码: ');
      if (password !== confirm) {
        console.log('✗ 两次输入不一致，请重试');
        continue;
      }
      break;
    }

    // 用户名占用检查
    const existedAccount = await accountRepo.findOne({
      where: { provider: 'local', provider_user_id: username },
    });
    if (existedAccount) {
      console.error(`✗ 用户名 "${username}" 已存在，拒绝创建（脚本不会覆盖已有账号）`);
      rl.close();
      process.exit(1);
    }

    // 已有 admin 提示
    const superRole = await roleRepo.findOne({ where: { name: 'super_admin' } });
    const fallbackAdmin = await roleRepo.findOne({ where: { name: 'admin' } });
    const roleId = superRole?.id || fallbackAdmin?.id;
    if (!roleId) {
      console.error('✗ 角色未初始化。请先启动应用让 seedRoles() 建角色后再运行本脚本。');
      rl.close();
      process.exit(1);
    }
    const existingAdmin = await userRepo.findOne({ where: { role_id: roleId } });
    if (existingAdmin) {
      const cont = await ask(rl, '⚠ 已存在管理员账号，是否继续创建新管理员？(y/N): ');
      if (cont.toLowerCase() !== 'y') {
        console.log('已取消');
        rl.close();
        process.exit(0);
      }
    }

    rl.close();

    // 写入
    const user = userRepo.create({ username, email, role_id: roleId });
    const savedUser = await userRepo.save(user);

    const passwordHash = await bcrypt.hash(password, 10);
    await accountRepo.save(
      accountRepo.create({
        user_id: savedUser.id,
        provider: 'local',
        provider_user_id: username,
        password_hash: passwordHash,
      }),
    );

    console.log(`\n✓ 管理员创建成功（用户名: ${username}）`);
    console.log('  请访问 /admin/login 登录');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('创建失败:', err);
  process.exit(1);
});
