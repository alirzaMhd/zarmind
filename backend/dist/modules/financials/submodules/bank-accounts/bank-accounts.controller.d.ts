import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { RecordTransactionDto } from './dto/record-transaction.dto';
export declare class BankAccountsController {
    private readonly service;
    constructor(service: BankAccountsService);
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
    findAll(page?: string, limit?: string, search?: string, branchId?: string, isActive?: string, accountType?: string, currency?: string, sortBy?: 'createdAt' | 'updatedAt' | 'accountName' | 'balance', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSummary(branchId?: string, currency?: string): Promise<{
        totalAccounts: any;
        totalBalance: number;
        byCurrency: any;
        byBranch: any;
        unreconciledTransactions: any;
    }>;
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
    getTransactions(id: string, from?: string, to?: string, type?: string, reconciled?: string, page?: string, limit?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    reconcile(id: string, body: {
        transactionIds: string[];
        reconciledDate?: string;
    }): Promise<{
        success: boolean;
        message: string;
        count: number;
    }>;
    activate(id: string): Promise<{
        success: boolean;
        message: string;
        isActive: any;
    }>;
    deactivate(id: string): Promise<{
        success: boolean;
        message: string;
        isActive: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
//# sourceMappingURL=bank-accounts.controller.d.ts.map