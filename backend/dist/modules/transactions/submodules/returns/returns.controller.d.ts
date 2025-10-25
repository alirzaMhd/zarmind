import { ReturnsService } from './returns.service';
import { UserRole, ReturnStatus, ReturnType } from '@zarmind/shared-types';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        role?: UserRole;
    };
}
export declare class ReturnsController {
    private readonly service;
    constructor(service: ReturnsService);
    create(dto: CreateReturnDto, req: AuthenticatedRequest): Promise<{
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
    findAll(page?: string, limit?: string, search?: string, type?: ReturnType, status?: ReturnStatus, customerId?: string, supplierId?: string, from?: string, to?: string, sortBy?: 'createdAt' | 'updatedAt' | 'returnDate' | 'refundAmount', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
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
    approve(id: string, body: {
        notes?: string;
    }, req: AuthenticatedRequest): Promise<{
        success: boolean;
        message: string;
        returnId: string;
        returnNumber: any;
    }>;
    reject(id: string, body: {
        reason: string;
        notes?: string;
    }, req: AuthenticatedRequest): Promise<{
        success: boolean;
        message: string;
        returnId: string;
        reason: string;
    }>;
    complete(id: string, body: {
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        returnId: string;
        returnNumber: any;
        refundAmount: number;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
export {};
//# sourceMappingURL=returns.controller.d.ts.map