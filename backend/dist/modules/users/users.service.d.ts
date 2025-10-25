import { PrismaService } from '../../core/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole, UserStatus } from '@zarmind/shared-types';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
type SafeUser = {
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
};
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto): Promise<SafeUser>;
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        role?: UserRole;
        status?: UserStatus;
        branchId?: string;
        sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<SafeUser>>;
    findOne(id: string): Promise<SafeUser>;
    update(id: string, dto: UpdateUserDto): Promise<SafeUser>;
    changePassword(id: string, dto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(id: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
        userId: string;
    }>;
    updateStatus(id: string, status: UserStatus): Promise<{
        success: boolean;
        message: string;
        userId: string;
        status: any;
    }>;
    updateRole(id: string, role: UserRole): Promise<{
        success: boolean;
        message: string;
        userId: string;
        role: any;
    }>;
    getSummary(): Promise<{
        totalUsers: any;
        byRole: any;
        byStatus: any;
        recentLogins: any;
    }>;
    getActivity(id: string, from?: string, to?: string, limit?: number): Promise<{
        userId: string;
        period: {
            from: string;
            to: string;
        };
        salesCount: any;
        purchasesCount: any;
        recentActivity: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private parseDateRange;
    private mapUser;
}
export {};
//# sourceMappingURL=users.service.d.ts.map