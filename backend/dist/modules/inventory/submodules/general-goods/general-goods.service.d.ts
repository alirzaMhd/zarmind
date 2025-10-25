import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateGeneralGoodsDto } from './dto/create-general-goods.dto';
import { UpdateGeneralGoodsDto } from './dto/update-general-goods.dto';
import { ProductStatus } from '@zarmind/shared-types';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class GeneralGoodsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        brand?: string;
        status?: ProductStatus;
        branchId?: string;
        minQuantity?: number;
        maxQuantity?: number;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'quantity' | 'name';
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
    adjustQuantity(id: string, adjustment: number, branchId?: string, notes?: string): Promise<{
        success: boolean;
        message: string;
        newQuantity: any;
        notes: string | undefined;
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
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateGeneralGoodsSKU;
    private decimalToNumber;
    private mapGeneralGoods;
}
export {};
//# sourceMappingURL=general-goods.service.d.ts.map