import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { RecordCurrencyTradeDto } from './dto/record-currency-trade.dto';
import { ProductStatus } from '@zarmind/shared-types';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class CurrencyService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        currencyCode?: string;
        status?: ProductStatus;
        branchId?: string;
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
    adjustQuantity(id: string, adjustment: number, branchId?: string, notes?: string): Promise<{
        success: boolean;
        message: string;
        newQuantity: any;
        notes: string | undefined;
    }>;
    getSummary(branchId?: string): Promise<{
        totalQuantity: any;
        byCurrency: any;
        lowStock: any;
    }>;
    getLatestExchangeRates(): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateCurrencySKU;
    private decimalToNumber;
    private mapCurrency;
}
export {};
//# sourceMappingURL=currency.service.d.ts.map