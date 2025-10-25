import { CurrencyService } from './currency.service';
import { ProductStatus } from '@zarmind/shared-types';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { RecordCurrencyTradeDto } from './dto/record-currency-trade.dto';
export declare class CurrencyController {
    private readonly service;
    constructor(service: CurrencyService);
    create(dto: CreateCurrencyDto): Promise<{
        id: any;
        sku: any;
        qrCode: any;
        name: any;
        description: any;
        category: any;
        status: any;
        purchasePrice: number;
        sellingPrice: number;
        currencyCode: any;
        quantity: any;
        images: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(page?: string, limit?: string, search?: string, currencyCode?: string, status?: ProductStatus, branchId?: string, minQuantity?: string, maxQuantity?: string, sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'quantity', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSummary(branchId?: string): Promise<{
        totalQuantity: any;
        byCurrency: any;
        lowStock: any;
    }>;
    getExchangeRates(): Promise<any>;
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
        currencyCode: any;
        quantity: any;
        images: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateCurrencyDto): Promise<{
        id: any;
        sku: any;
        qrCode: any;
        name: any;
        description: any;
        category: any;
        status: any;
        purchasePrice: number;
        sellingPrice: number;
        currencyCode: any;
        quantity: any;
        images: any;
        inventory: any;
        createdAt: any;
        updatedAt: any;
    }>;
    recordTrade(id: string, dto: RecordCurrencyTradeDto): Promise<{
        success: boolean;
        message: string;
        currencyCode: any;
        quantity: number;
        rate: number | undefined;
        newQuantity: any;
        notes: string | undefined;
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
//# sourceMappingURL=currency.controller.d.ts.map