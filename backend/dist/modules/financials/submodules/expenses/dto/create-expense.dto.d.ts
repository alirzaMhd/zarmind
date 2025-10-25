import { PaymentMethod } from '@zarmind/shared-types';
export declare class CreateExpenseDto {
    categoryId: string;
    amount: number;
    expenseDate: string;
    title: string;
    description?: string;
    vendor?: string;
    invoiceNumber?: string;
    receiptImages?: string[];
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
}
//# sourceMappingURL=create-expense.dto.d.ts.map