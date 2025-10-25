import { CoinType, ProductStatus } from '@zarmind/shared-types';
export declare class CreateCoinDto {
    sku?: string;
    qrCode?: string;
    name: string;
    description?: string;
    status?: ProductStatus;
    weight?: number;
    purchasePrice?: number;
    sellingPrice?: number;
    coinType: CoinType;
    coinYear?: number;
    quantity?: number;
    images?: string[];
    branchId?: string;
    minimumStock?: number;
    location?: string;
}
//# sourceMappingURL=create-coin.dto.d.ts.map