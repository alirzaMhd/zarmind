import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export interface JwtPayload {
  sub: string;            // user id
  email: string;
  role?: string;          // e.g., SUPER_ADMIN, ADMIN, ...
  status?: string;        // e.g., ACTIVE, INACTIVE
  branchId?: string | null;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role?: string;
  status?: string;
  branchId?: string | null;
}

const cookieExtractor = (req: Request): string | null =>
  (req?.cookies?.access_token as string) || null;

const headerTokenExtractor = (req: Request): string | null => {
  const header = req?.headers?.['x-access-token'];
  if (!header) return null;
  return Array.isArray(header) ? header[0] : (header as string);
};

const queryExtractor = (req: Request): string | null => {
  const q: any = req?.query;
  if (q?.token && typeof q.token === 'string') return q.token;
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  // Note: don't use a parameter property here (no "private readonly")
  // to avoid touching `this` before super().
  private readonly config: ConfigService;

  constructor(configService: ConfigService) {
    const secret =
      configService.get<string>('JWT_ACCESS_SECRET') ??
      configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error(
        'JWT secret is not configured. Please set JWT_ACCESS_SECRET or JWT_SECRET in your environment variables.'
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
        headerTokenExtractor,
        queryExtractor,
      ]),
      secretOrKey: secret, // Now TypeScript knows this is definitely a string
      issuer: configService.get<string>('JWT_ISSUER'),
      audience: configService.get<string>('JWT_AUDIENCE'),
      ignoreExpiration: false,
      algorithms: ['HS256'],
    });

    this.config = configService;
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      status: payload.status,
      branchId: payload.branchId ?? null,
    };
  }
}