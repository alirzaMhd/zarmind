import { EmploymentStatus, EmploymentType } from '@zarmind/shared-types';
export declare class CreateEmployeeDto {
    employeeCode?: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    nationalId?: string;
    position: string;
    department?: string;
    employmentType: EmploymentType;
    hireDate: string;
    terminationDate?: string;
    status?: EmploymentStatus;
    branchId?: string;
    baseSalary?: number;
    commissionRate?: number;
    address?: string;
    city?: string;
    birthDate?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    notes?: string;
}
//# sourceMappingURL=create-employee.dto.d.ts.map