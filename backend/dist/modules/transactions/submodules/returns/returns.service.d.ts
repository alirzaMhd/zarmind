import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { ReturnStatus, ReturnType } from '@zarmind/shared-types';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class ReturnsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateReturnDto, createdByUserId: string): Promise<{
        id: any;
        returnNumber: any;
        returnDate: any;
        type: any;
        status: any;
        reason: any;
        originalSaleId: any;
        originalSale: any;
        originalPurchaseId: any;
        originalPurchase: any;
        customerId: any;
        supplierId: any;
        reasonDetails: any;
        refundAmount: number;
        refundMethod: any;
        approvedBy: any;
        approvedAt: any;
        rejectedReason: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        type?: ReturnType;
        status?: ReturnStatus;
        customerId?: string;
        supplierId?: string;
        from?: string;
        to?: string;
        sortBy?: 'createdAt' | 'updatedAt' | 'returnDate' | 'refundAmount';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<any>>;
    findOne(id: string): Promise<{
        id: any;
        returnNumber: any;
        returnDate: any;
        type: any;
        status: any;
        reason: any;
        originalSaleId: any;
        originalSale: any;
        originalPurchaseId: any;
        originalPurchase: any;
        customerId: any;
        supplierId: any;
        reasonDetails: any;
        refundAmount: number;
        refundMethod: any;
        approvedBy: any;
        approvedAt: any;
        rejectedReason: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateReturnDto): Promise<{
        id: any;
        returnNumber: any;
        returnDate: any;
        type: any;
        status: any;
        reason: any;
        originalSaleId: any;
        originalSale: any;
        originalPurchaseId: any;
        originalPurchase: any;
        customerId: any;
        supplierId: any;
        reasonDetails: any;
        refundAmount: number;
        refundMethod: any;
        approvedBy: any;
        approvedAt: any;
        rejectedReason: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
    }>;
    approve(id: string, approvedByUserId: string, notes?: string): Promise<{
        success: boolean;
        message: string;
        returnId: string;
        returnNumber: any;
    }>;
    reject(id: string, rejectedByUserId: string, reason: string, notes?: string): Promise<{
        success: boolean;
        message: string;
        returnId: string;
        reason: string;
    }>;
    complete(id: string, notes?: string): Promise<{
        success: boolean;
        message: string;
        returnId: string;
        returnNumber: any;
        refundAmount: number;
    }>;
    getSummary(from?: string, to?: string, type?: ReturnType): Promise<{
        period: {
            from: string;
            to: string;
        };
        totalReturns: any;
        totalRefundAmount: number;
        byStatus: any;
        byReason: any;
        byType: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateReturnNumber;
    private parseDateRange;
    private decimalToNumber;
    private mapReturn;
}
export {};
//# sourceMappingURL=returns.service.d.ts.map