import { StonesService } from './stones.service';
import { ProductStatus, StoneType } from '@zarmind/shared-types';
import { CreateStoneDto } from './dto/create-stone.dto';
import { UpdateStoneDto } from './dto/update-stone.dto';
export declare class StonesController {
    private readonly service;
    constructor(service: StonesService);
    create(dto: CreateStoneDto): any;
    findAll(page?: string, limit?: string, search?: string, stoneType?: StoneType, status?: ProductStatus, branchId?: string, minCaratWeight?: string, maxCaratWeight?: string, minPrice?: string, maxPrice?: string, quality?: string, hasCertificate?: string, sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'caratWeight' | 'quantity', sortOrder?: 'asc' | 'desc'): any;
    getSummary(branchId?: string): any;
    findByCertificate(certificateNumber: string): any;
    findOne(id: string): any;
    update(id: string, dto: UpdateStoneDto): any;
    adjustQuantity(id: string, body: {
        adjustment: number;
        branchId?: string;
        notes?: string;
    }): any;
    remove(id: string): any;
    private toPosInt;
}
//# sourceMappingURL=stones.controller.d.ts.map