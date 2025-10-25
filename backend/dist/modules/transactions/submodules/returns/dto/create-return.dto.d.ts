import { ReturnType, ReturnStatus, ReturnReason, PaymentMethod } from '@zarmind/shared-types';
export declare class CreateReturnDto {
    returnNumber?: string;
    returnDate: string;
    type: ReturnType;
    status?: ReturnStatus;
    reason?: ReturnReason;
    originalSaleId?: string;
    originalPurchaseId?: string;
    customerId?: string;
    supplierId?: string;
    reasonDetails?: string;
    refundAmount: number;
    refundMethod?: PaymentMethod;
    notes?: string;
}
//# sourceMappingURL=create-return.dto.d.ts.map