import { PurchasesService } from './purchases.service';
import { PurchaseStatus } from '@zarmind/shared-types';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
export declare class PurchasesController {
    private readonly service;
    constructor(service: PurchasesService);
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
    findAll(page?: string, limit?: string, search?: string, status?: PurchaseStatus, supplierId?: string, branchId?: string, userId?: string, from?: string, to?: string, minAmount?: string, maxAmount?: string, sortBy?: 'createdAt' | 'updatedAt' | 'purchaseDate' | 'totalAmount', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
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
    receiveItems(id: string, body: {
        itemId: string;
        receivedQuantity: number;
        notes?: string;
    }[]): Promise<{
        success: boolean;
        message: string;
        purchaseId: string;
        status: PurchaseStatus;
    }>;
    complete(id: string, body: {
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        purchaseId: string;
        purchaseNumber: any;
    }>;
    cancel(id: string, body: {
        reason: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        purchaseId: string;
        reason: string;
        inventoryReversed: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
//# sourceMappingURL=purchases.controller.d.ts.map