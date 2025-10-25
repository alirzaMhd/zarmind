import { Response } from 'express';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly service;
    constructor(service: ReportsService);
    getProfitLoss(from?: string, to?: string, branchId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getBalanceSheet(asOf?: string, branchId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getInventoryValuation(asOf?: string, branchId?: string, category?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getSalesReport(from?: string, to?: string, branchId?: string, userId?: string, customerId?: string, groupBy?: 'day' | 'week' | 'month' | 'product' | 'customer' | 'user', format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getPurchasesReport(from?: string, to?: string, branchId?: string, supplierId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getCashFlow(from?: string, to?: string, branchId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getARAgingReport(asOf?: string, customerId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getAPAgingReport(asOf?: string, supplierId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getTaxReport(from?: string, to?: string, taxType?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getEmployeePerformance(from?: string, to?: string, employeeId?: string, branchId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getCustomerTransactions(customerId?: string, from?: string, to?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getProductMovement(productId?: string, category?: string, from?: string, to?: string, branchId?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getGoldPriceImpact(from?: string, to?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getWorkshopPerformance(workshopId?: string, from?: string, to?: string, format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    getCustomReport(reportId?: string, params?: string, // JSON string of parameters
    format?: 'json' | 'pdf' | 'excel'): Promise<any>;
    exportReport(format: 'pdf' | 'excel' | 'csv', params?: string, res?: Response): Promise<{
        message: string;
        params: any;
    }>;
    private validateDateRange;
}
//# sourceMappingURL=reports.controller.d.ts.map