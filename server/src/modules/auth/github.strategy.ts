// server/src/modules/auth/github.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from './auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['read:user'],
      passReqToCallback: true,
    });
  }

  async validate(req: any, accessToken: string, refreshToken: string, profile: any) {
    const state = req.query.state as string;
    const isValid = await this.authService.validateState(state);
    if (!isValid) throw new UnauthorizedException('Invalid OAuth state');

    const { id, username, avatar_url } = profile;
    const user = await this.authService.validateGithubUser(id, username, avatar_url);
    if (!user) throw new UnauthorizedException('You are not authorized to access the admin panel');
    return user;
  }
}
