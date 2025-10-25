import { PaymentMethod, SaleStatus } from '@zarmind/shared-types';
declare class SaleItemDto {
    productId: string;
    quantity: number;
    weight?: number;
    unitPrice: number;
    goldPrice?: number;
    stonePrice?: number;
    craftsmanshipFee?: number;
    discount?: number;
}
export declare class CreateSaleDto {
    invoiceNumber?: string;
    saleDate?: string;
    status?: SaleStatus;
    customerId?: string;
    branchId: string;
    items: SaleItemDto[];
    taxAmount?: number;
    discountAmount?: number;
    paidAmount?: number;
    paymentMethod: PaymentMethod;
    notes?: string;
}
export {};
//# sourceMappingURL=create-sale.dto.d.ts.map