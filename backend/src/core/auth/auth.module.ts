import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../database/prisma.service';

// Simple parser: supports "15m", "7d", "10h", "30s", "1w" or raw seconds like "900"
function parseExpiresInToSeconds(value?: string): number {
  const fallback = 15 * 60; // 15 minutes
  if (!value) return fallback;

  const trimmed = value.trim().toLowerCase();

  // If it's a plain number, interpret as seconds
  if (/^\d+$/.test(trimmed)) return Number(trimmed);

  const match = trimmed.match(/^(\d+)\s*(s|m|h|d|w)$/);
  if (!match) return fallback;

  const num = parseInt(match[1], 10);
  const unit = match[2] as 's' | 'm' | 'h' | 'd' | 'w';
  const unitMap = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 } as const;

  return num * unitMap[unit];
}

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const rawExp = config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
        const expiresIn = parseExpiresInToSeconds(rawExp); // number (seconds), avoids typing issues

        return {
          secret:
            config.get<string>('JWT_ACCESS_SECRET') ??
            config.get<string>('JWT_SECRET') ??
            'change_me',
          signOptions: {
            expiresIn, // number of seconds
            issuer: config.get<string>('JWT_ISSUER'),
            audience: config.get<string>('JWT_AUDIENCE'),
            algorithm: 'HS256',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, PrismaService],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}