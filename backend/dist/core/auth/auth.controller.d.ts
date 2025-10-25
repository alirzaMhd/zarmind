import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { AuthenticatedUser } from './strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
export declare class AuthController {
    private readonly authService;
    private readonly config;
    constructor(authService: AuthService, config: ConfigService);
    login(dto: LoginDto, req: Request, res: Response): Promise<{
        accessToken: string;
        tokenType: string;
        expiresAt: Date | undefined;
        user: {
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
    }>;
    me(req: Request & {
        user: AuthenticatedUser;
    }): Promise<{
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
    }>;
    logout(res: Response): Promise<{
        success: boolean;
    }>;
    test(): {
        message: string;
        timestamp: Date;
    };
}
//# sourceMappingURL=auth.controller.d.ts.map