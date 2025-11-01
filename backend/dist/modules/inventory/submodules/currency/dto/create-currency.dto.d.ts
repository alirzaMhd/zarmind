import { ProductStatus } from '@zarmind/shared-types';
export declare class CreateCurrencyDto {
    sku?: string;
    qrCode?: string;
    name?: string;
    description?: string;
    status?: ProductStatus;
    purchasePrice?: number;
    sellingPrice?: number;
    currencyCode: string;
    quantity?: number;
    images?: string[];
    branchId?: string;
    minimumStock?: number;
    location?: string;
    allocations?: AllocationDto[];
}
declare class AllocationDto {
    branchId: string;
    quantity: number;
    minimumStock?: number;
    location?: string;
}
export {};
//# sourceMappingURL=create-currency.dto.d.ts.map