import { CheckType, CheckStatus } from '@zarmind/shared-types';
export declare class CreateCheckDto {
    checkNumber: string;
    type: CheckType;
    status?: CheckStatus;
    amount: number;
    issueDate: string;
    dueDate: string;
    bankName: string;
    branchName?: string;
    accountNumber?: string;
    issuerName?: string;
    customerId?: string;
    supplierId?: string;
    payeeName?: string;
    checkImages?: string[];
    notes?: string;
}
//# sourceMappingURL=create-check.dto.d.ts.map