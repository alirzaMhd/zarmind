import { UsersService } from './users.service';
import { UserRole, UserStatus } from '@zarmind/shared-types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        role?: UserRole;
    };
}
export declare class UsersController {
    private readonly service;
    constructor(service: UsersService);
    create(dto: CreateUserDto): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        phone?: string | null;
        role: UserRole;
        status: UserStatus;
        branchId?: string | null;
        employeeId?: string | null;
        lastLoginAt?: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(page?: string, limit?: string, search?: string, role?: UserRole, status?: UserStatus, branchId?: string, sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email', sortOrder?: 'asc' | 'desc'): Promise<{
        items: {
            id: string;
            email: string;
            username: string;
            firstName: string;
            lastName: string;
            phone?: string | null;
            role: UserRole;
            status: UserStatus;
            branchId?: string | null;
            employeeId?: string | null;
            lastLoginAt?: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSummary(): Promise<{
        totalUsers: any;
        byRole: any;
        byStatus: any;
        recentLogins: any;
    }>;
    getProfile(req: AuthenticatedRequest): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        phone?: string | null;
        role: UserRole;
        status: UserStatus;
        branchId?: string | null;
        employeeId?: string | null;
        lastLoginAt?: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        phone?: string | null;
        role: UserRole;
        status: UserStatus;
        branchId?: string | null;
        employeeId?: string | null;
        lastLoginAt?: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(req: AuthenticatedRequest, dto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        phone?: string | null;
        role: UserRole;
        status: UserStatus;
        branchId?: string | null;
        employeeId?: string | null;
        lastLoginAt?: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        phone?: string | null;
        role: UserRole;
        status: UserStatus;
        branchId?: string | null;
        employeeId?: string | null;
        lastLoginAt?: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    changePassword(req: AuthenticatedRequest, dto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(id: string, body: {
        newPassword: string;
    }): Promise<{
        success: boolean;
        message: string;
        userId: string;
    }>;
    updateStatus(id: string, body: {
        status: UserStatus;
    }): Promise<{
        success: boolean;
        message: string;
        userId: string;
        status: any;
    }>;
    updateRole(id: string, body: {
        role: UserRole;
    }): Promise<{
        success: boolean;
        message: string;
        userId: string;
        role: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getActivity(id: string, from?: string, to?: string, limit?: string): Promise<{
        userId: string;
        period: {
            from: string;
            to: string;
        };
        salesCount: any;
        purchasesCount: any;
        recentActivity: any;
    }>;
    private toPosInt;
}
export {};
//# sourceMappingURL=users.controller.d.ts.map