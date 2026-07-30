import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, Role, Account } from '../../entities';
import { RedisService } from '../../redis';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let accountRepo: any;
  let roleRepo: any;
  let jwtService: any;
  let redisService: any;

  beforeEach(async () => {
    userRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    accountRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    roleRepo = { findOne: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('mock-token') };
    redisService = { set: jest.fn(), get: jest.fn(), del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Account), useValue: accountRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('应在用户名未占用时成功注册', async () => {
      accountRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue({ id: 1, name: 'user' });
      userRepo.create.mockReturnValue({ id: 1, username: 'newuser' });
      userRepo.save.mockResolvedValue({ id: 1, username: 'newuser', role_id: 1 });
      accountRepo.create.mockReturnValue({});
      accountRepo.save.mockResolvedValue({});

      const result = await service.register('newuser', 'password123', 'test@test.com');
      expect(result.token).toBe('mock-token');
      expect(userRepo.save).toHaveBeenCalled();
      expect(accountRepo.save).toHaveBeenCalled();
    });

    it('应在用户名已存在时抛出 ConflictException', async () => {
      accountRepo.findOne.mockResolvedValue({ id: 1 });
      await expect(service.register('existing', 'password123', 'test@test.com'))
        .rejects.toThrow('用户名已存在');
    });
  });

  describe('validateLocalUser', () => {
    it('应在密码正确时返回用户', async () => {
      const hash = await bcrypt.hash('password123', 10);
      accountRepo.findOne.mockResolvedValue({
        id: 1,
        provider: 'local',
        provider_user_id: 'testuser',
        password_hash: hash,
      });
      userRepo.findOne.mockResolvedValue({ id: 1, username: 'testuser', role_id: 1 });

      const user = await service.validateLocalUser('testuser', 'password123');
      expect(user).toBeTruthy();
      expect(user.username).toBe('testuser');
    });

    it('应在密码错误时抛出 UnauthorizedException', async () => {
      const hash = await bcrypt.hash('correct', 10);
      accountRepo.findOne.mockResolvedValue({
        id: 1,
        password_hash: hash,
      });
      await expect(service.validateLocalUser('testuser', 'wrongpassword'))
        .rejects.toThrow('用户名或密码错误');
    });
  });

  describe('generateToken', () => {
    it('应使用 sub/username/role 签发 JWT', async () => {
      const user = { id: 5, username: 'admin', role_id: 1 } as any;
      jest.spyOn(service, 'getRoleName').mockResolvedValue('admin');
      await service.generateToken(user);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 5,
        username: 'admin',
        role: 'admin',
      });
    });
  });
});
