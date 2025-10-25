import { PrismaService } from '../../core/database/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierStatus } from '@zarmind/shared-types';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class SuppliersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateSupplierDto): Promise<{
        id: any;
        code: any;
        name: any;
        contactPerson: any;
        phone: any;
        email: any;
        address: any;
        city: any;
        postalCode: any;
        paymentTerms: any;
        rating: any;
        categories: any;
        licenseNumber: any;
        taxId: any;
        notes: any;
        website: any;
        status: any;
        createdAt: any;
        updatedAt: any;
        purchases: any;
        payables: any;
    }>;
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        status?: SupplierStatus;
        category?: string;
        city?: string;
        minRating?: number;
        maxRating?: number;
        sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'rating' | 'code';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<any>>;
    findOne(id: string): Promise<{
        id: any;
        code: any;
        name: any;
        contactPerson: any;
        phone: any;
        email: any;
        address: any;
        city: any;
        postalCode: any;
        paymentTerms: any;
        rating: any;
        categories: any;
        licenseNumber: any;
        taxId: any;
        notes: any;
        website: any;
        status: any;
        createdAt: any;
        updatedAt: any;
        purchases: any;
        payables: any;
    }>;
    update(id: string, dto: UpdateSupplierDto): Promise<{
        id: any;
        code: any;
        name: any;
        contactPerson: any;
        phone: any;
        email: any;
        address: any;
        city: any;
        postalCode: any;
        paymentTerms: any;
        rating: any;
        categories: any;
        licenseNumber: any;
        taxId: any;
        notes: any;
        website: any;
        status: any;
        createdAt: any;
        updatedAt: any;
        purchases: any;
        payables: any;
    }>;
    updateRating(id: string, rating: number, notes?: string): Promise<{
        success: boolean;
        message: string;
        supplierId: string;
        rating: number;
        notes: string | undefined;
    }>;
    getPurchases(id: string, from?: string, to?: string): Promise<{
        supplierId: string;
        period: {
            from: string;
            to: string;
        };
        totalPurchases: any;
        totalAmount: any;
        purchases: any;
    }>;
    getPayables(id: string): Promise<{
        supplierId: string;
        totalPayables: any;
        payables: any;
    }>;
    getPerformance(id: string, from?: string, to?: string): Promise<{
        supplierId: string;
        supplierName: any;
        period: {
            from: string;
            to: string;
        };
        totalPurchases: any;
        totalSpent: number;
        onTimeDeliveryRate: number;
        rating: any;
        categories: any;
        paymentTerms: any;
    }>;
    getSummary(): Promise<{
        totalSuppliers: any;
        byStatus: any;
        byCategory: {
            category: string;
            count: number;
        }[];
        topSuppliers: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateSupplierCode;
    private parseDateRange;
    private decimalToNumber;
    private mapSupplier;
}
export {};
//# sourceMappingURL=suppliers.service.d.ts.map