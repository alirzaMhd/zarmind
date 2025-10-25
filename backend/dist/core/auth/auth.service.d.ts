import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
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
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    private parseBool;
    private parseExpiresInToSeconds;
    login(dto: LoginDto, userAgent?: string, ipAddress?: string): Promise<{
        accessToken: string;
        expiresAt?: Date;
        user: SafeUser;
    }>;
    getProfile(userId: string): Promise<SafeUser>;
    private findUserByIdentifier;
}
export {};
//# sourceMappingURL=auth.service.d.ts.map