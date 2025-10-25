import { UserRole, UserStatus } from '@zarmind/shared-types';
export declare class CreateUserDto {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
    status?: UserStatus;
    branchId?: string;
    employeeId?: string;
}
//# sourceMappingURL=create-user.dto.d.ts.map