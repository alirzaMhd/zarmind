import { StonesService } from './stones.service';
import { ProductStatus, StoneType } from '@zarmind/shared-types';
import { CreateStoneDto } from './dto/create-stone.dto';
import { UpdateStoneDto } from './dto/update-stone.dto';
export declare class StonesController {
    private readonly service;
    constructor(service: StonesService);
    create(dto: CreateStoneDto): Promise<{
        id: any;
        sku: any;
        qrCode: any;
        name: any;
        description: any;
        category: any;
        status: any;
        purchasePrice: number;
        sellingPrice: number;
        stoneType: any;
        caratWeight: number;
        stoneQuality: any;
        certificateNumber: any;
        quantity: any;
        images: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(page?: string, limit?: string, search?: string, stoneType?: StoneType, status?: ProductStatus, branchId?: string, minCaratWeight?: string, maxCaratWeight?: string, minPrice?: string, maxPrice?: string, quality?: string, hasCertificate?: string, sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'caratWeight' | 'quantity', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSummary(branchId?: string): Promise<{
        totalStones: any;
        totalQuantity: any;
        totalCaratWeight: number;
        totalPurchaseValue: number;
        totalSellingValue: number;
        certifiedStones: any;
        byType: any;
        byQuality: any;
        lowStock: any;
    }>;
    findByCertificate(certificateNumber: string): Promise<{
        id: any;
        sku: any;
        qrCode: any;
        name: any;
        description: any;
        category: any;
        status: any;
        purchasePrice: number;
        sellingPrice: number;
        stoneType: any;
        caratWeight: number;
        stoneQuality: any;
        certificateNumber: any;
        quantity: any;
        images: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findOne(id: string): Promise<{
        id: any;
        sku: any;
        qrCode: any;
        name: any;
        description: any;
        category: any;
        status: any;
        purchasePrice: number;
        sellingPrice: number;
        stoneType: any;
        caratWeight: number;
        stoneQuality: any;
        certificateNumber: any;
        quantity: any;
        images: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateStoneDto): Promise<{
        id: any;
        sku: any;
        qrCode: any;
        name: any;
        description: any;
        category: any;
        status: any;
        purchasePrice: number;
        sellingPrice: number;
        stoneType: any;
        caratWeight: number;
        stoneQuality: any;
        certificateNumber: any;
        quantity: any;
        images: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    adjustQuantity(id: string, body: {
        adjustment: number;
        branchId?: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        newQuantity: any;
        notes: string | undefined;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
//# sourceMappingURL=stones.controller.d.ts.map