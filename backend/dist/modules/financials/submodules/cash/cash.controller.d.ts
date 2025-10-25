import { CashService } from './cash.service';
import { UserRole, CashTransactionType } from '@zarmind/shared-types';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { UpdateCashTransactionDto } from './dto/update-cash-transaction.dto';
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        role?: UserRole;
    };
}
export declare class CashController {
    private readonly service;
    constructor(service: CashService);
    create(dto: CreateCashTransactionDto, req: AuthenticatedRequest): Promise<{
        id: any;
        type: any;
        amount: number;
        transactionDate: any;
        branchId: any;
        branch: any;
        userId: any;
        user: any;
        category: any;
        referenceType: any;
        referenceId: any;
        description: any;
        receiptNumber: any;
        createdAt: any;
    }>;
    findAll(page?: string, limit?: string, search?: string, branchId?: string, type?: CashTransactionType, category?: string, userId?: string, from?: string, to?: string, minAmount?: string, maxAmount?: string, sortBy?: 'createdAt' | 'updatedAt' | 'transactionDate' | 'amount', sortOrder?: 'asc' | 'desc'): Promise<{
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
        branchId: string;
        totalCashIn: number;
        totalCashOut: number;
        netCashFlow: number;
        totalTransactions: any;
        byCategoryIn: any;
        byCategoryOut: any;
        byUser: any;
    }>;
    getCurrentBalance(branchId?: string): Promise<{
        branchId: string;
        currentBalance: number;
    }>;
    findOne(id: string): Promise<{
        id: any;
        type: any;
        amount: number;
        transactionDate: any;
        branchId: any;
        branch: any;
        userId: any;
        user: any;
        category: any;
        referenceType: any;
        referenceId: any;
        description: any;
        receiptNumber: any;
        createdAt: any;
    }>;
    update(id: string, dto: UpdateCashTransactionDto): Promise<{
        id: any;
        type: any;
        amount: number;
        transactionDate: any;
        branchId: any;
        branch: any;
        userId: any;
        user: any;
        category: any;
        referenceType: any;
        referenceId: any;
        description: any;
        receiptNumber: any;
        createdAt: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
export {};
//# sourceMappingURL=cash.controller.d.ts.map