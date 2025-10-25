import { GeneralGoodsService } from './general-goods.service';
import { ProductStatus } from '@zarmind/shared-types';
import { CreateGeneralGoodsDto } from './dto/create-general-goods.dto';
import { UpdateGeneralGoodsDto } from './dto/update-general-goods.dto';
export declare class GeneralGoodsController {
    private readonly service;
    constructor(service: GeneralGoodsService);
    create(dto: CreateGeneralGoodsDto): Promise<{
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
        brand: any;
        model: any;
        quantity: any;
        images: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(page?: string, limit?: string, search?: string, brand?: string, status?: ProductStatus, branchId?: string, minQuantity?: string, maxQuantity?: string, minPrice?: string, maxPrice?: string, sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'quantity' | 'name', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSummary(branchId?: string): Promise<{
        totalProducts: any;
        totalQuantity: any;
        totalPurchaseValue: number;
        totalSellingValue: number;
        byBrand: any;
        lowStock: any;
    }>;
    getBrands(): Promise<any>;
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
        brand: any;
        model: any;
        quantity: any;
        images: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateGeneralGoodsDto): Promise<{
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
        brand: any;
        model: any;
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
//# sourceMappingURL=general-goods.controller.d.ts.map