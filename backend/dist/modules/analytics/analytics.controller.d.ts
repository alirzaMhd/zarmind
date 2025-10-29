import { PrismaService } from '../../core/database/prisma.service';
import { ProductCategory } from '@zarmind/shared-types';
import { RedisService } from '../../core/cache/redis.service';
import { GoldCurrencyService } from './gold-currency.service';
type Granularity = 'day' | 'week' | 'month';
export declare class AnalyticsController {
    private readonly prisma;
    private readonly goldCurrencyService;
    private readonly redis?;
    constructor(prisma: PrismaService, goldCurrencyService: GoldCurrencyService, redis?: RedisService | undefined);
    getDashboardSummary(branchId?: string): Promise<{
        today: {
            sales: {
                count: any;
                total: number;
            };
            purchases: {
                count: any;
                total: number;
            };
            cashFlow: number;
        };
        month: {
            revenue: number;
        };
        totals: {
            activeCustomers: any;
            pendingOrders: any;
            lowStockCount: any;
            inventoryValue: number;
            cashOnHand: number;
            totalProducts: any;
            totalSuppliers: any;
            monthlyPurchases: number;
            monthlyExpenses: number;
            receivablesTotal: number;
            payablesTotal: number;
        };
        recentTransactions: any;
        lowStockItems: any;
    }>;
    getGoldCurrencyPrices(): Promise<import("./gold-currency.service").GoldCurrencyData>;
    getSalesTrend(from?: string, to?: string, granularity?: Granularity, branchId?: string): Promise<{
        range: {
            from: string;
            to: string;
        };
        granularity: Granularity;
        total: number;
        points: {
            key: string;
            value: number;
        }[];
    }>;
    getTopProducts(from?: string, to?: string, limitStr?: string, branchId?: string): Promise<{
        range: {
            from: string;
            to: string;
        };
        totalProducts: number;
        top: {
            productId: string;
            name: string;
            sku: string | null;
            category: ProductCategory;
            qty: number;
            revenue: number;
        }[];
    }>;
    getInventoryValuation(branchId?: string): Promise<{
        byCategory: {
            category: ProductCategory;
            quantity: number;
            purchaseValue: number;
            retailValue: number;
        }[];
        totals: {
            purchaseValue: number;
            retailValue: number;
            markupPct: number | null;
        };
    }>;
    getFinancialKpi(from?: string, to?: string, branchId?: string): Promise<{
        range: {
            from: string;
            to: string;
        };
        revenue: number;
        purchases: number;
        expenses: number;
        grossProfit: number;
        netProfit: number;
        grossProfitMargin: number | null;
        netProfitMargin: number | null;
        operatingCashFlow: number;
        currentRatio: number | null;
        quickRatio: number | null;
        workingCapital: number;
    }>;
    private parseDateRange;
    private normalizeGranularity;
    private bucketKey;
    private seriesFromGroups;
    private decimalToNumber;
    private parseIntSafe;
    private redisKey;
    private wrapCache;
}
export {};
//# sourceMappingURL=analytics.controller.d.ts.map