import { ProductsService } from './products.service';
import { ProductStatus, GoldPurity } from '@zarmind/shared-types';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsController {
    private readonly service;
    constructor(service: ProductsService);
    create(dto: CreateProductDto): Promise<{
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
        craftsmanshipFee: number;
        quantity: any;
        images: any;
        scaleImage: any;
        workshopId: any;
        workshop: any;
        productionStatus: any;
        stones: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(page?: string, limit?: string, search?: string, goldPurity?: GoldPurity, status?: ProductStatus, branchId?: string, workshopId?: string, productionStatus?: string, minPrice?: string, maxPrice?: string, minWeight?: string, maxWeight?: string, sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'weight' | 'name', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSummary(branchId?: string): Promise<{
        totalProducts: any;
        totalWeight: number;
        totalPurchaseValue: number;
        totalSellingValue: number;
        totalCraftsmanshipFees: number;
        byPurity: any;
        byStatus: any;
        lowStock: any;
    }>;
    findByQrCode(qrCode: string): Promise<{
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
        craftsmanshipFee: number;
        quantity: any;
        images: any;
        scaleImage: any;
        workshopId: any;
        workshop: any;
        productionStatus: any;
        stones: any;
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
        weight: number;
        purchasePrice: number;
        sellingPrice: number;
        goldPurity: any;
        craftsmanshipFee: number;
        quantity: any;
        images: any;
        scaleImage: any;
        workshopId: any;
        workshop: any;
        productionStatus: any;
        stones: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateProductDto): Promise<{
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
        craftsmanshipFee: number;
        quantity: any;
        images: any;
        scaleImage: any;
        workshopId: any;
        workshop: any;
        productionStatus: any;
        stones: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateProductionStatus(id: string, body: {
        productionStatus: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        productId: string;
        productionStatus: string;
        notes: string | undefined;
    }>;
    addStone(id: string, body: {
        stoneType: string;
        caratWeight: number;
        quantity: number;
        price: number;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        stone: {
            id: any;
            stoneType: any;
            caratWeight: number;
            quantity: any;
            price: number;
            notes: any;
        };
    }>;
    removeStone(id: string, stoneId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    remove(id: string, force?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
//# sourceMappingURL=products.controller.d.ts.map