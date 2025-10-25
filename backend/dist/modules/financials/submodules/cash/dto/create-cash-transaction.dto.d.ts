import { CashTransactionType } from '@zarmind/shared-types';
export declare class CreateCashTransactionDto {
    type: CashTransactionType;
    amount: number;
    transactionDate?: string;
    branchId: string;
    category?: string;
    referenceType?: string;
    referenceId?: string;
    description?: string;
    receiptNumber?: string;
}
//# sourceMappingURL=create-cash-transaction.dto.d.ts.map