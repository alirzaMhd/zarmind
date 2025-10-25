import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { UpdateCashTransactionDto } from './dto/update-cash-transaction.dto';
import { CashTransactionType } from '@zarmind/shared-types';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class CashService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCashTransactionDto, createdByUserId: string): Promise<{
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
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        branchId?: string;
        type?: CashTransactionType;
        category?: string;
        userId?: string;
        from?: string;
        to?: string;
        minAmount?: number;
        maxAmount?: number;
        sortBy?: 'createdAt' | 'updatedAt' | 'transactionDate' | 'amount';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<any>>;
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
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private parseDateRange;
    private decimalToNumber;
    private mapCashTransaction;
}
export {};
//# sourceMappingURL=cash.service.d.ts.map