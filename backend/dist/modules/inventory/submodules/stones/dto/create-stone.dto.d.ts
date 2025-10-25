import { ProductStatus, StoneType } from '@zarmind/shared-types';
export declare class CreateStoneDto {
    sku?: string;
    qrCode?: string;
    name: string;
    description?: string;
    status?: ProductStatus;
    purchasePrice?: number;
    sellingPrice?: number;
    stoneType: StoneType;
    caratWeight: number;
    stoneQuality?: string;
    certificateNumber?: string;
    quantity?: number;
    images?: string[];
    branchId?: string;
    minimumStock?: number;
    location?: string;
}
//# sourceMappingURL=create-stone.dto.d.ts.map