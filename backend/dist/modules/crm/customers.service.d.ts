import { PrismaService } from '../../core/database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerStatus, CustomerType } from '@zarmind/shared-types';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class CustomersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCustomerDto): Promise<{
        id: any;
        code: any;
        type: any;
        status: any;
        firstName: any;
        lastName: any;
        businessName: any;
        phone: any;
        email: any;
        nationalId: any;
        address: any;
        city: any;
        postalCode: any;
        creditLimit: number;
        currentBalance: number;
        notes: any;
        birthDate: any;
        anniversary: any;
        loyaltyPoints: any;
        tags: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(params: {
        page?: number;
        limit?: number;
        search?: string;
        type?: CustomerType;
        status?: CustomerStatus;
        tags?: string[];
        city?: string;
        sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'businessName' | 'code';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<any>>;
    findOne(id: string): Promise<{
        id: any;
        code: any;
        type: any;
        status: any;
        firstName: any;
        lastName: any;
        businessName: any;
        phone: any;
        email: any;
        nationalId: any;
        address: any;
        city: any;
        postalCode: any;
        creditLimit: number;
        currentBalance: number;
        notes: any;
        birthDate: any;
        anniversary: any;
        loyaltyPoints: any;
        tags: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateCustomerDto): Promise<{
        id: any;
        code: any;
        type: any;
        status: any;
        firstName: any;
        lastName: any;
        businessName: any;
        phone: any;
        email: any;
        nationalId: any;
        address: any;
        city: any;
        postalCode: any;
        creditLimit: number;
        currentBalance: number;
        notes: any;
        birthDate: any;
        anniversary: any;
        loyaltyPoints: any;
        tags: any;
        createdAt: any;
        updatedAt: any;
    }>;
    /**
     * Delete behavior:
     * - If the customer has NO related receivables or sales -> hard delete (remove row)
     * - If there are relations -> soft delete (set status to INACTIVE)
     */
    remove(id: string): Promise<{
        success: boolean;
        deleted: boolean;
        softDeleted: boolean;
        customer?: undefined;
    } | {
        success: boolean;
        deleted: boolean;
        softDeleted: boolean;
        customer: {
            id: any;
            code: any;
            type: any;
            status: any;
            firstName: any;
            lastName: any;
            businessName: any;
            phone: any;
            email: any;
            nationalId: any;
            address: any;
            city: any;
            postalCode: any;
            creditLimit: number;
            currentBalance: number;
            notes: any;
            birthDate: any;
            anniversary: any;
            loyaltyPoints: any;
            tags: any;
            createdAt: any;
            updatedAt: any;
        };
    }>;
    getReceivables(id: string): Promise<any>;
    getSales(id: string): Promise<any>;
    getSummary(params?: {
        city?: string;
    }): Promise<{
        total: any;
        active: any;
        inactive: any;
        blacklisted: any;
        totalReceivables: number;
        byCity: any;
        byType: any;
    }>;
    private generateCustomerCode;
    private decimalToNumber;
    private mapCustomer;
}
export {};
//# sourceMappingURL=customers.service.d.ts.map