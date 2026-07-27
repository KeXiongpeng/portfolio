// server/src/modules/auth/auth.controller.ts
import { Controller, Get, Req, Res, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const token = await this.authService.generateToken(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${frontendUrl}/admin/dashboard`);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const token = await this.authService.generateToken({ id: user.id, github_id: user.githubId, username: user.username, role: user.role } as any);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ message: 'Token refreshed' });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  }
}
