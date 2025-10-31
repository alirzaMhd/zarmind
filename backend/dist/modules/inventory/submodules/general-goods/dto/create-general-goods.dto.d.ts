import { ProductStatus } from '@zarmind/shared-types';
export declare class CreateGeneralGoodsDto {
    sku?: string;
    qrCode?: string;
    name: string;
    description?: string;
    status?: ProductStatus;
    weight?: number;
    purchasePrice?: number;
    sellingPrice?: number;
    brand?: string;
    model?: string;
    quantity?: number;
    images?: string[];
    branchId?: string;
    minimumStock?: number;
    location?: string;
    allocations?: Array<{
        branchId: string;
        quantity: number;
        minimumStock?: number;
        location?: string;
    }>;
}
//# sourceMappingURL=create-general-goods.dto.d.ts.map