import { PaymentMethod, PurchaseStatus } from '@zarmind/shared-types';
declare class PurchaseItemDto {
    productId: string;
    quantity: number;
    weight?: number;
    unitPrice: number;
}
export declare class CreatePurchaseDto {
    purchaseNumber?: string;
    purchaseDate: string;
    status?: PurchaseStatus;
    supplierId?: string;
    userId: string;
    branchId: string;
    items: PurchaseItemDto[];
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    paidAmount?: number;
    paymentMethod: PaymentMethod;
    deliveryDate?: string;
    notes?: string;
}
export {};
//# sourceMappingURL=create-purchase.dto.d.ts.map