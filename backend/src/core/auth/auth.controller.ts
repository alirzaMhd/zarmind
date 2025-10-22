import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      dto,
      req.headers['user-agent'] ?? undefined,
      (req.ip ||
        (Array.isArray(req.ips) && req.ips[0]) ||
        undefined) as string | undefined,
    );

    // Optionally set httpOnly cookie
    const useCookies =
      String(this.config.get('AUTH_USE_COOKIES') ?? '').toLowerCase() ===
      'true';

    if (useCookies) {
      const cookieName = this.config.get('JWT_COOKIE_NAME') || 'access_token';
      const secure =
        (this.config.get('JWT_COOKIE_SECURE') ?? '').toString().toLowerCase() ===
          'true' || process.env.NODE_ENV === 'production';
      const sameSite =
        (this.config.get('JWT_COOKIE_SAME_SITE') as 'lax' | 'strict' | 'none') ||
        'lax';
      const domain = this.config.get('JWT_COOKIE_DOMAIN');

      // Align cookie lifetime with token expiration if available
      let maxAge = 0;
      if (result.expiresAt) {
        const diff = result.expiresAt.getTime() - Date.now();
        maxAge = diff > 0 ? diff : 0;
      } else {
        // Fallbacks if exp is missing
        maxAge = dto.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
      }

      res.cookie(cookieName, result.accessToken, {
        httpOnly: true,
        secure,
        sameSite,
        domain,
        maxAge,
        path: '/',
      });
    }

    return {
      accessToken: result.accessToken,
      tokenType: 'Bearer',
      expiresAt: result.expiresAt,
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request & { user: AuthenticatedUser }) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // Best-effort cookie clear; token revocation would require a blacklist
    const cookieName = this.config.get('JWT_COOKIE_NAME') || 'access_token';
    res.clearCookie(cookieName, { path: '/' });
    return { success: true };
  }
}