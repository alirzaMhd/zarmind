import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateCoinDto } from './dto/create-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { ProductStatus, CoinType } from '@zarmind/shared-types';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class CoinsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCoinDto): Promise<{
        id: any;
        sku: any;
        qrCode: any;
        name: any;
        description: any;
        category: any;
        status: any;
        weight: number;
        purchasePrice: number;
        sellingPrice: number;
        coinType: any;
        coinYear: any;
        quantity: any;
        images: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        coinType?: CoinType;
        status?: ProductStatus;
        branchId?: string;
        coinYear?: number;
        minQuantity?: number;
        maxQuantity?: number;
        sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'quantity';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<any>>;
    findOne(id: string): Promise<{
        id: any;
        sku: any;
        qrCode: any;
        name: any;
        description: any;
        category: any;
        status: any;
        weight: number;
        purchasePrice: number;
        sellingPrice: number;
        coinType: any;
        coinYear: any;
        quantity: any;
        images: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateCoinDto): Promise<{
        id: any;
        sku: any;
        qrCode: any;
        name: any;
        description: any;
        category: any;
        status: any;
        weight: number;
        purchasePrice: number;
        sellingPrice: number;
        coinType: any;
        coinYear: any;
        quantity: any;
        images: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    adjustQuantity(id: string, adjustment: number, branchId?: string, notes?: string): Promise<{
        success: boolean;
        message: string;
        newQuantity: any;
        notes: string | undefined;
    }>;
    getSummary(branchId?: string): Promise<{
        totalQuantity: any;
        totalPurchaseValue: number;
        totalSellingValue: number;
        byType: any;
        lowStock: any;
    }>;
    remove(id: string, force?: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateCoinSKU;
    private coinTypeCode;
    private decimalToNumber;
    private mapCoin;
}
export {};
//# sourceMappingURL=coins.service.d.ts.map