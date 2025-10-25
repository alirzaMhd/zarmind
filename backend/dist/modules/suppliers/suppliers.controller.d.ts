import { SuppliersService } from './suppliers.service';
import { SupplierStatus } from '@zarmind/shared-types';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
export declare class SuppliersController {
    private readonly service;
    constructor(service: SuppliersService);
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
    findAll(page?: string, limit?: string, search?: string, status?: SupplierStatus, category?: string, city?: string, minRating?: string, maxRating?: string, sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'rating' | 'code', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
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
    updateRating(id: string, body: {
        rating: number;
        notes?: string;
    }): Promise<{
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
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
//# sourceMappingURL=suppliers.controller.d.ts.map