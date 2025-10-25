import { BankTransactionType } from '@zarmind/shared-types';
export declare class RecordTransactionDto {
    type: BankTransactionType;
    amount: number;
    transactionDate?: string;
    referenceNumber?: string;
    description?: string;
    category?: string;
    allowNegative?: boolean;
}
//# sourceMappingURL=record-transaction.dto.d.ts.map