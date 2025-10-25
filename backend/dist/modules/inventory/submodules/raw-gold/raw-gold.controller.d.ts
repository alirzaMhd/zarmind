import { RawGoldService } from './raw-gold.service';
import { ProductStatus, GoldPurity } from '@zarmind/shared-types';
import { CreateRawGoldDto } from './dto/create-raw-gold.dto';
import { UpdateRawGoldDto } from './dto/update-raw-gold.dto';
export declare class RawGoldController {
    private readonly service;
    constructor(service: RawGoldService);
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
    findAll(page?: string, limit?: string, search?: string, goldPurity?: GoldPurity, status?: ProductStatus, branchId?: string, minWeight?: string, maxWeight?: string, minPrice?: string, maxPrice?: string, sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'weight', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSummary(branchId?: string): Promise<{
        totalItems: any;
        totalWeight: number;
        totalPurchaseValue: number;
        totalSellingValue: number;
        byPurity: any;
        lowStock: any;
    }>;
    getValuation(branchId?: string): Promise<{
        valuation: any;
        totalValue: any;
        pricesAsOf: any;
    }>;
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
    adjustWeight(id: string, body: {
        adjustment: number;
        branchId?: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        newWeight: number;
        notes: string | undefined;
    }>;
    transferToWorkshop(id: string, body: {
        workshopId: string;
        weight: number;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        rawGoldId: string;
        workshopId: string;
        transferredWeight: number;
        remainingWeight: number;
        goldPurity: any;
        notes: string | undefined;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
//# sourceMappingURL=raw-gold.controller.d.ts.map