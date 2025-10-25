import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { RecordTransactionDto } from './dto/record-transaction.dto';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class BankAccountsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateBankAccountDto): Promise<{
        id: any;
        accountName: any;
        accountNumber: any;
        bankName: any;
        branchName: any;
        iban: any;
        swiftCode: any;
        branchId: any;
        branch: any;
        balance: number;
        currency: any;
        accountType: any;
        isActive: any;
        notes: any;
        transactions: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        branchId?: string;
        isActive?: boolean;
        accountType?: string;
        currency?: string;
        sortBy?: 'createdAt' | 'updatedAt' | 'accountName' | 'balance';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<any>>;
    findOne(id: string): Promise<{
        id: any;
        accountName: any;
        accountNumber: any;
        bankName: any;
        branchName: any;
        iban: any;
        swiftCode: any;
        branchId: any;
        branch: any;
        balance: number;
        currency: any;
        accountType: any;
        isActive: any;
        notes: any;
        transactions: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateBankAccountDto): Promise<{
        id: any;
        accountName: any;
        accountNumber: any;
        bankName: any;
        branchName: any;
        iban: any;
        swiftCode: any;
        branchId: any;
        branch: any;
        balance: number;
        currency: any;
        accountType: any;
        isActive: any;
        notes: any;
        transactions: any;
        createdAt: any;
        updatedAt: any;
    }>;
    recordTransaction(id: string, dto: RecordTransactionDto): Promise<{
        success: boolean;
        message: string;
        transaction: {
            id: any;
            type: any;
            amount: number;
            transactionDate: any;
            balanceAfter: number;
        };
        newBalance: number;
    }>;
    getTransactions(id: string, params: {
        from?: string;
        to?: string;
        type?: string;
        reconciled?: boolean;
        page: number;
        limit: number;
    }): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    reconcileTransactions(id: string, transactionIds: string[], reconciledDate?: string): Promise<{
        success: boolean;
        message: string;
        count: number;
    }>;
    toggleActive(id: string, isActive: boolean): Promise<{
        success: boolean;
        message: string;
        isActive: any;
    }>;
    getSummary(branchId?: string, currency?: string): Promise<{
        totalAccounts: any;
        totalBalance: number;
        byCurrency: any;
        byBranch: any;
        unreconciledTransactions: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private decimalToNumber;
    private mapBankAccount;
}
export {};
//# sourceMappingURL=bank-accounts.service.d.ts.map