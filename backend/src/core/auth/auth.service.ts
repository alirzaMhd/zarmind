import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

type SafeUser = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  status: string;
  branchId?: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private parseBool(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    }
    if (typeof value === 'number') return value === 1;
    return fallback;
  }

  // Supports: "15m", "7d", "10h", "30s", "1w" or raw seconds like "900"
  private parseExpiresInToSeconds(value?: string): number {
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

  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    accessToken: string;
    expiresAt?: Date;
    user: SafeUser;
  }> {
    const user = await this.findUserByIdentifier(dto.email, dto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passOk = await bcrypt.compare(dto.password, user.password);
    if (!passOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status && user.status !== 'ACTIVE') {
      throw new ForbiddenException('User account is not active');
    }

    // Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const remember =
      dto.rememberMe ??
      this.parseBool(this.config.get('AUTH_REMEMBER_DEFAULT') ?? false, false);

    const rawExp = remember
      ? this.config.get<string>('JWT_ACCESS_EXPIRES_REMEMBER') ?? '7d'
      : this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';

    // Convert to number (seconds) to satisfy JwtSignOptions typing
    const expiresIn = this.parseExpiresInToSeconds(rawExp);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      branchId: user.branchId ?? null,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn, // number of seconds
      issuer: this.config.get<string>('JWT_ISSUER'),
      audience: this.config.get<string>('JWT_AUDIENCE'),
    });

    // Derive expiresAt from token's exp claim
    const decoded = this.jwt.decode(accessToken) as { exp?: number } | null;
    const expiresAt =
      decoded?.exp && typeof decoded.exp === 'number'
        ? new Date(decoded.exp * 1000)
        : undefined;

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      branchId: user.branchId ?? null,
      lastLoginAt: new Date(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Optional: create an audit log
    // await this.prisma.auditLog.create({
    //   data: {
    //     userId: user.id,
    //     action: 'LOGIN',
    //     entityType: 'User',
    //     entityId: user.id,
    //     newValue: { userAgent, ipAddress },
    //   },
    // });

    return { accessToken, expiresAt, user: safeUser };
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        branchId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user as SafeUser;
  }

  private async findUserByIdentifier(
    email?: string,
    username?: string,
  ): Promise<(SafeUser & { password: string }) | null> {
    if (!email && !username) return null;

    const user = await this.prisma.user.findUnique({
      where: email ? { email } : { username: username! },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        branchId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    });

    return user as (SafeUser & { password: string }) | null;
  }
}