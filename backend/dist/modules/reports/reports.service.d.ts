import { PrismaService } from '../../core/database/prisma.service';
import { Response } from 'express';
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProfitLossReport(from?: string, to?: string, branchId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getBalanceSheetReport(asOf?: string, branchId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getInventoryValuationReport(asOf?: string, branchId?: string, category?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getSalesReport(from?: string, to?: string, branchId?: string, userId?: string, customerId?: string, groupBy?: 'day' | 'week' | 'month' | 'product' | 'customer' | 'user', format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getPurchasesReport(from?: string, to?: string, branchId?: string, supplierId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getCashFlowReport(from?: string, to?: string, branchId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getARAgingReport(asOf?: string, customerId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getAPAgingReport(asOf?: string, supplierId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getTaxReport(from?: string, to?: string, taxType?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getEmployeePerformanceReport(from?: string, to?: string, employeeId?: string, branchId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getCustomerTransactionsReport(customerId: string, from?: string, to?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getProductMovementReport(productId?: string, category?: string, from?: string, to?: string, branchId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getGoldPriceImpactReport(from?: string, to?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getWorkshopPerformanceReport(workshopId?: string, from?: string, to?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getCustomReport(reportId: string, params: any, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    exportReport(format: 'pdf' | 'excel' | 'csv', params: any, res?: Response): Promise<{
        message: string;
        params: any;
    }>;
    private parseDateRange;
    private dec;
    private formatReport;
}
//# sourceMappingURL=reports.service.d.ts.map