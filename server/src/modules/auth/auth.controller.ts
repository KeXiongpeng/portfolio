// server/src/modules/auth/auth.controller.ts
import { Controller, Get, Req, Res, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /** 账号密码注册 */
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const { token } = await this.authService.register(dto.username, dto.password, dto.email);
    this.setAuthCookie(res, token);
    res.json({ token });
  }

  /** 账号密码登录 */
  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const user = await this.authService.validateLocalUser(dto.username, dto.password);
    const token = await this.authService.generateToken(user);
    this.setAuthCookie(res, token);
    res.json({ token });
  }

  /** GitHub 登录入口 */
  @Public()
  @Get('github')
  async githubLogin(@Req() req: Request, @Res() res: Response) {
    const state = await this.authService.generateState();
    const githubAuthUrl =
      `https://github.com/login/oauth/authorize?` +
      `client_id=${process.env.GITHUB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GITHUB_CALLBACK_URL)}&` +
      `state=${state}`;
    res.redirect(githubAuthUrl);
  }

  /** GitHub 回调 */
  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const token = await this.authService.generateToken(user);
    this.setAuthCookie(res, token);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/api/auth/set-cookie?token=${encodeURIComponent(token)}&dest=${encodeURIComponent('/admin/dashboard')}`;
    res.redirect(redirectUrl);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const token = await this.authService.refreshToken(user.id);
    this.setAuthCookie(res, token);
    res.json({ message: 'Token refreshed' });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  }

  /** 统一设置 auth cookie */
  private setAuthCookie(res: Response, token: string) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
