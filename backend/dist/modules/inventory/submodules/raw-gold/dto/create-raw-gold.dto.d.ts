import { ProductStatus, GoldPurity } from '@zarmind/shared-types';
export declare class CreateRawGoldDto {
    sku?: string;
    qrCode?: string;
    name: string;
    description?: string;
    status?: ProductStatus;
    weight: number;
    purchasePrice?: number;
    sellingPrice?: number;
    goldPurity: GoldPurity;
    quantity?: number;
    images?: string[];
    scaleImage?: string;
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
//# sourceMappingURL=create-raw-gold.dto.d.ts.map