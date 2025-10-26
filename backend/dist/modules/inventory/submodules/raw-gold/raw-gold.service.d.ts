import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateRawGoldDto } from './dto/create-raw-gold.dto';
import { UpdateRawGoldDto } from './dto/update-raw-gold.dto';
import { ProductStatus, GoldPurity } from '@zarmind/shared-types';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class RawGoldService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateRawGoldDto): Promise<{
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
        goldPurity: any;
        quantity: any;
        images: any;
        scaleImage: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        goldPurity?: GoldPurity;
        status?: ProductStatus;
        branchId?: string;
        minWeight?: number;
        maxWeight?: number;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'weight';
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
        goldPurity: any;
        quantity: any;
        images: any;
        scaleImage: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateRawGoldDto): Promise<{
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
        goldPurity: any;
        quantity: any;
        images: any;
        scaleImage: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    adjustWeight(id: string, adjustment: number, branchId?: string, notes?: string): Promise<{
        success: boolean;
        message: string;
        newWeight: number;
        notes: string | undefined;
    }>;
    transferToWorkshop(id: string, workshopId: string, weight: number, notes?: string): Promise<{
        success: boolean;
        message: string;
        rawGoldId: string;
        workshopId: string;
        transferredWeight: number;
        remainingWeight: number;
        goldPurity: any;
        notes: string | undefined;
    }>;
    getSummary(branchId?: string): Promise<{
        totalItems: number;
        totalWeight: number;
        totalPurchaseValue: number;
        totalSellingValue: number;
        byPurity: {
            count: number;
            totalWeight: number;
            purchaseValue: number;
            sellingValue: number;
            goldPurity: string;
        }[];
        lowStock: any;
    }>;
    getValuation(branchId?: string): Promise<{
        valuation: any;
        totalValue: any;
        pricesAsOf: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateRawGoldSKU;
    private decimalToNumber;
    private mapRawGold;
}
export {};
//# sourceMappingURL=raw-gold.service.d.ts.map