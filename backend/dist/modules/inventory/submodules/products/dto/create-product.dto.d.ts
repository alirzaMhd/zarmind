import { ProductStatus, GoldPurity, StoneType } from '@zarmind/shared-types';
declare class EmbeddedStoneDto {
    stoneType: StoneType;
    caratWeight: number;
    quantity?: number;
    price: number;
    notes?: string;
}
export declare class CreateProductDto {
    sku?: string;
    qrCode?: string;
    name: string;
    description?: string;
    status?: ProductStatus;
    weight?: number;
    purchasePrice?: number;
    sellingPrice?: number;
    goldPurity?: GoldPurity;
    craftsmanshipFee?: number;
    quantity?: number;
    images?: string[];
    scaleImage?: string;
    workshopId?: string;
    productionStatus?: string;
    stones?: EmbeddedStoneDto[];
    branchId?: string;
    minimumStock?: number;
    location?: string;
}
export {};
//# sourceMappingURL=create-product.dto.d.ts.map