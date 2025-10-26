import { PrismaService } from '../../../../core/database/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseStatus } from '@zarmind/shared-types';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class PurchasesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreatePurchaseDto): Promise<{
        id: any;
        purchaseNumber: any;
        purchaseDate: any;
        status: any;
        supplierId: any;
        supplier: any;
        userId: any;
        user: any;
        branchId: any;
        branch: any;
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        paidAmount: number;
        paymentMethod: any;
        deliveryDate: any;
        notes: any;
        items: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        status?: PurchaseStatus;
        supplierId?: string;
        branchId?: string;
        userId?: string;
        from?: string;
        to?: string;
        minAmount?: number;
        maxAmount?: number;
        sortBy?: 'createdAt' | 'updatedAt' | 'purchaseDate' | 'totalAmount';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<any>>;
    findOne(id: string): Promise<{
        id: any;
        purchaseNumber: any;
        purchaseDate: any;
        status: any;
        supplierId: any;
        supplier: any;
        userId: any;
        user: any;
        branchId: any;
        branch: any;
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        paidAmount: number;
        paymentMethod: any;
        deliveryDate: any;
        notes: any;
        items: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdatePurchaseDto): Promise<{
        id: any;
        purchaseNumber: any;
        purchaseDate: any;
        status: any;
        supplierId: any;
        supplier: any;
        userId: any;
        user: any;
        branchId: any;
        branch: any;
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        paidAmount: number;
        paymentMethod: any;
        deliveryDate: any;
        notes: any;
        items: any;
        createdAt: any;
        updatedAt: any;
    }>;
    receiveItems(id: string, items: Array<{
        itemId: string;
        receivedQuantity: number;
        notes?: string;
    }>): Promise<{
        success: boolean;
        message: string;
        purchaseId: string;
        status: PurchaseStatus;
    }>;
    completePurchase(id: string, notes?: string): Promise<{
        success: boolean;
        message: string;
        purchaseId: string;
        purchaseNumber: any;
    }>;
    cancelPurchase(id: string, reason: string, notes?: string): Promise<{
        success: boolean;
        message: string;
        purchaseId: string;
        reason: string;
        inventoryReversed: boolean;
    }>;
    getSummary(from?: string, to?: string, branchId?: string): Promise<{
        period: {
            from: string;
            to: string;
        };
        totalPurchases: any;
        totalAmount: number;
        totalPaid: number;
        outstandingAmount: number;
        byStatus: any;
        topSuppliers: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private updateInventoryForPurchase;
    private updateInventoryForItem;
    private reverseInventoryForItem;
    private generatePurchaseNumber;
    private parseDateRange;
    private decimalToNumber;
    private mapPurchase;
}
export {};
//# sourceMappingURL=purchases.service.d.ts.map