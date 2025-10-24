import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Response } from 'express';
import {
  SaleStatus,
  PurchaseStatus,
  ProductCategory,
  GoldPurity,
} from '@zarmind/shared-types';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // Profit & Loss Report
  async getProfitLossReport(
    from?: string,
    to?: string,
    branchId?: string,
    format?: 'json' | 'pdf' | 'excel',
  ) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const where: any = {
      ...(branchId ? { branchId } : {}),
    };

    const [sales, purchases, expenses] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          ...where,
          status: SaleStatus.COMPLETED,
          saleDate: { gte: fromDate, lte: toDate },
        },
        _sum: { totalAmount: true, subtotal: true, taxAmount: true, discountAmount: true },
      }),

      this.prisma.purchase.aggregate({
        where: {
          ...where,
          status: PurchaseStatus.COMPLETED,
          purchaseDate: { gte: fromDate, lte: toDate },
        },
        _sum: { totalAmount: true, subtotal: true, taxAmount: true },
      }),

      this.prisma.expense.aggregate({
        where: {
          expenseDate: { gte: fromDate, lte: toDate },
        },
        _sum: { amount: true },
      }),
    ]);

    const revenue = this.dec(sales._sum.totalAmount);
    const costOfGoodsSold = this.dec(purchases._sum.totalAmount);
    const operatingExpenses = this.dec(expenses._sum.amount);
    const grossProfit = revenue - costOfGoodsSold;
    const netProfit = grossProfit - operatingExpenses;

    const report = {
      reportType: 'PROFIT_LOSS',
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      branchId: branchId ?? 'ALL',
      revenue,
      costOfGoodsSold,
      grossProfit,
      grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      operatingExpenses,
      netProfit,
      netProfitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
      details: {
        salesSubtotal: this.dec(sales._sum.subtotal),
        salesTax: this.dec(sales._sum.taxAmount),
        salesDiscount: this.dec(sales._sum.discountAmount),
        purchasesSubtotal: this.dec(purchases._sum.subtotal),
        purchasesTax: this.dec(purchases._sum.taxAmount),
      },
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Balance Sheet Report
  async getBalanceSheetReport(asOf?: string, branchId?: string, format?: 'json' | 'pdf' | 'excel') {
    const asOfDate = asOf ? new Date(asOf) : new Date();

    const [bankAccounts, inventory, receivables, payables, cash] = await Promise.all([
      this.prisma.bankAccount.aggregate({
        where: { ...(branchId ? { branchId } : {}), isActive: true },
        _sum: { balance: true },
      }),

      this.prisma.product.aggregate({
        where: {
          status: 'IN_STOCK',
          ...(branchId ? { inventory: { some: { branchId } } } : {}),
        },
        _sum: { purchasePrice: true },
      }),

      this.prisma.accountsReceivable.aggregate({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        _sum: { remainingAmount: true },
      }),

      this.prisma.accountsPayable.aggregate({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        _sum: { remainingAmount: true },
      }),

      this.prisma.cashTransaction.aggregate({
        where: {
          type: 'CASH_IN',
          ...(branchId ? { branchId } : {}),
        },
        _sum: { amount: true },
      }),
    ]);

    const assets = {
      cash: this.dec(cash._sum.amount),
      bankAccounts: this.dec(bankAccounts._sum.balance),
      accountsReceivable: this.dec(receivables._sum.remainingAmount),
      inventory: this.dec(inventory._sum.purchasePrice),
    };

    const liabilities = {
      accountsPayable: this.dec(payables._sum.remainingAmount),
    };

    const totalAssets = Object.values(assets).reduce((sum, val) => sum + val, 0);
    const totalLiabilities = Object.values(liabilities).reduce((sum, val) => sum + val, 0);
    const equity = totalAssets - totalLiabilities;

    const report = {
      reportType: 'BALANCE_SHEET',
      asOf: asOfDate.toISOString(),
      branchId: branchId ?? 'ALL',
      assets: { ...assets, total: totalAssets },
      liabilities: { ...liabilities, total: totalLiabilities },
      equity: { totalEquity: equity },
      totalLiabilitiesAndEquity: totalLiabilities + equity,
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Inventory Valuation Report
  async getInventoryValuationReport(
    asOf?: string,
    branchId?: string,
    category?: string,
    format?: 'json' | 'pdf' | 'excel',
  ) {
    const asOfDate = asOf ? new Date(asOf) : new Date();

    const where: any = {
      status: 'IN_STOCK',
      ...(category ? { category: category as ProductCategory } : {}),
      ...(branchId ? { inventory: { some: { branchId } } } : {}),
    };

    const products = await this.prisma.product.groupBy({
      by: ['category'],
      where,
      _sum: { purchasePrice: true, sellingPrice: true, weight: true, quantity: true },
      _count: true,
    });

    const byCategory = products.map((p: any) => ({
      category: p.category,
      count: p._count,
      quantity: p._sum.quantity ?? 0,
      totalWeight: this.dec(p._sum.weight),
      purchaseValue: this.dec(p._sum.purchasePrice),
      sellingValue: this.dec(p._sum.sellingPrice),
      potentialProfit: this.dec(p._sum.sellingPrice) - this.dec(p._sum.purchasePrice),
    }));

    const totalPurchaseValue = byCategory.reduce((sum: any, c: any) => sum + c.purchaseValue, 0);
    const totalSellingValue = byCategory.reduce((sum: any, c: any) => sum + c.sellingValue, 0);

    const report = {
      reportType: 'INVENTORY_VALUATION',
      asOf: asOfDate.toISOString(),
      branchId: branchId ?? 'ALL',
      category: category ?? 'ALL',
      totalPurchaseValue,
      totalSellingValue,
      totalPotentialProfit: totalSellingValue - totalPurchaseValue,
      byCategory,
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Sales Report
  async getSalesReport(
    from?: string,
    to?: string,
    branchId?: string,
    userId?: string,
    customerId?: string,
    groupBy?: 'day' | 'week' | 'month' | 'product' | 'customer' | 'user',
    format?: 'json' | 'pdf' | 'excel',
  ) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const where: any = {
      status: SaleStatus.COMPLETED,
      saleDate: { gte: fromDate, lte: toDate },
      ...(branchId ? { branchId } : {}),
      ...(userId ? { userId } : {}),
      ...(customerId ? { customerId } : {}),
    };

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, businessName: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        items: { include: { product: { select: { name: true, category: true } } } },
      },
      orderBy: { saleDate: 'desc' },
    });

    const report = {
      reportType: 'SALES',
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum: any, s: any) => sum + this.dec(s.totalAmount), 0),
      totalProfit: sales.reduce((sum: any, s: any) => sum + (this.dec(s.totalAmount) - this.dec(s.subtotal)), 0),
      sales: sales.map((s: any) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        date: s.saleDate,
        customer: s.customer
          ? {
              id: s.customer.id,
              name: s.customer.businessName || `${s.customer.firstName} ${s.customer.lastName}`,
            }
          : null,
        user: s.user ? { id: s.user.id, name: `${s.user.firstName} ${s.user.lastName}` } : null,
        items: s.items.map((i: any) => ({
          product: i.product?.name,
          quantity: i.quantity,
          unitPrice: this.dec(i.unitPrice),
          subtotal: this.dec(i.subtotal),
        })),
        subtotal: this.dec(s.subtotal),
        tax: this.dec(s.taxAmount),
        discount: this.dec(s.discountAmount),
        total: this.dec(s.totalAmount),
      })),
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Purchases Report
  async getPurchasesReport(
    from?: string,
    to?: string,
    branchId?: string,
    supplierId?: string,
    format?: 'json' | 'pdf' | 'excel',
  ) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const purchases = await this.prisma.purchase.findMany({
      where: {
        status: PurchaseStatus.COMPLETED,
        purchaseDate: { gte: fromDate, lte: toDate },
        ...(branchId ? { branchId } : {}),
        ...(supplierId ? { supplierId } : {}),
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { name: true, category: true } } } },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    const report = {
      reportType: 'PURCHASES',
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totalPurchases: purchases.length,
      totalAmount: purchases.reduce((sum: any, p: any) => sum + this.dec(p.totalAmount), 0),
      purchases: purchases.map((p: any) => ({
        id: p.id,
        purchaseNumber: p.purchaseNumber,
        date: p.purchaseDate,
        supplier: p.supplier ? { id: p.supplier.id, name: p.supplier.name } : null,
        items: p.items.map((i: any) => ({
          product: i.product?.name,
          quantity: i.quantity,
          unitPrice: this.dec(i.unitPrice),
          subtotal: this.dec(i.subtotal),
        })),
        subtotal: this.dec(p.subtotal),
        tax: this.dec(p.taxAmount),
        total: this.dec(p.totalAmount),
      })),
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Cash Flow Report
  async getCashFlowReport(
    from?: string,
    to?: string,
    branchId?: string,
    format?: 'json' | 'pdf' | 'excel',
  ) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const [cashIn, cashOut] = await Promise.all([
      this.prisma.cashTransaction.aggregate({
        where: {
          type: 'CASH_IN',
          transactionDate: { gte: fromDate, lte: toDate },
          ...(branchId ? { branchId } : {}),
        },
        _sum: { amount: true },
      }),

      this.prisma.cashTransaction.aggregate({
        where: {
          type: 'CASH_OUT',
          transactionDate: { gte: fromDate, lte: toDate },
          ...(branchId ? { branchId } : {}),
        },
        _sum: { amount: true },
      }),
    ]);

    const totalCashIn = this.dec(cashIn._sum.amount);
    const totalCashOut = this.dec(cashOut._sum.amount);
    const netCashFlow = totalCashIn - totalCashOut;

    const report = {
      reportType: 'CASH_FLOW',
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      branchId: branchId ?? 'ALL',
      cashIn: totalCashIn,
      cashOut: totalCashOut,
      netCashFlow,
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // AR Aging Report
  async getARAgingReport(asOf?: string, customerId?: string, format?: 'json' | 'pdf' | 'excel') {
    const asOfDate = asOf ? new Date(asOf) : new Date();

    const receivables = await this.prisma.accountsReceivable.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        ...(customerId ? { customerId } : {}),
      },
      include: { customer: { select: { id: true, firstName: true, lastName: true, businessName: true } } },
    });

    const aging = receivables.map((r: any) => {
      const daysOverdue = r.dueDate
        ? Math.floor((asOfDate.getTime() - r.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let agingBucket = 'Current';
      if (daysOverdue > 90) agingBucket = '90+ days';
      else if (daysOverdue > 60) agingBucket = '61-90 days';
      else if (daysOverdue > 30) agingBucket = '31-60 days';
      else if (daysOverdue > 0) agingBucket = '1-30 days';

      return {
        ...r,
        daysOverdue,
        agingBucket,
        customer: r.customer
          ? {
              id: r.customer.id,
              name: r.customer.businessName || `${r.customer.firstName} ${r.customer.lastName}`,
            }
          : null,
        amount: this.dec(r.amount),
        paidAmount: this.dec(r.paidAmount),
        remainingAmount: this.dec(r.remainingAmount),
      };
    });

    const report = {
      reportType: 'AR_AGING',
      asOf: asOfDate.toISOString(),
      totalReceivables: aging.reduce((sum: any, a: any) => sum + a.remainingAmount, 0),
      receivables: aging,
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // AP Aging Report
  async getAPAgingReport(asOf?: string, supplierId?: string, format?: 'json' | 'pdf' | 'excel') {
    const asOfDate = asOf ? new Date(asOf) : new Date();

    const payables = await this.prisma.accountsPayable.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        ...(supplierId ? { supplierId } : {}),
      },
      include: { supplier: { select: { id: true, name: true } } },
    });

    const aging = payables.map((p: any) => {
      const daysOverdue = p.dueDate
        ? Math.floor((asOfDate.getTime() - p.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let agingBucket = 'Current';
      if (daysOverdue > 90) agingBucket = '90+ days';
      else if (daysOverdue > 60) agingBucket = '61-90 days';
      else if (daysOverdue > 30) agingBucket = '31-60 days';
      else if (daysOverdue > 0) agingBucket = '1-30 days';

      return {
        ...p,
        daysOverdue,
        agingBucket,
        amount: this.dec(p.amount),
        paidAmount: this.dec(p.paidAmount),
        remainingAmount: this.dec(p.remainingAmount),
      };
    });

    const report = {
      reportType: 'AP_AGING',
      asOf: asOfDate.toISOString(),
      totalPayables: aging.reduce((sum: any, a: any) => sum + a.remainingAmount, 0),
      payables: aging,
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Tax Report
  async getTaxReport(from?: string, to?: string, taxType?: string, format?: 'json' | 'pdf' | 'excel') {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const [salesTax, purchasesTax] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          status: SaleStatus.COMPLETED,
          saleDate: { gte: fromDate, lte: toDate },
        },
        _sum: { taxAmount: true, totalAmount: true },
      }),

      this.prisma.purchase.aggregate({
        where: {
          status: PurchaseStatus.COMPLETED,
          purchaseDate: { gte: fromDate, lte: toDate },
        },
        _sum: { taxAmount: true, totalAmount: true },
      }),
    ]);

    const report = {
      reportType: 'TAX',
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      taxType: taxType ?? 'VAT',
      salesTaxCollected: this.dec(salesTax._sum.taxAmount),
      purchasesTaxPaid: this.dec(purchasesTax._sum.taxAmount),
      netTaxLiability: this.dec(salesTax._sum.taxAmount) - this.dec(purchasesTax._sum.taxAmount),
      totalSales: this.dec(salesTax._sum.totalAmount),
      totalPurchases: this.dec(purchasesTax._sum.totalAmount),
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Employee Performance Report
  async getEmployeePerformanceReport(
    from?: string,
    to?: string,
    employeeId?: string,
    branchId?: string,
    format?: 'json' | 'pdf' | 'excel',
  ) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const sales = await this.prisma.sale.findMany({
      where: {
        status: SaleStatus.COMPLETED,
        saleDate: { gte: fromDate, lte: toDate },
        ...(employeeId ? { userId: employeeId } : {}),
        ...(branchId ? { branchId } : {}),
      },
      include: {
        user: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, position: true } },
          },
        },
      },
    });

    const byEmployee: Record<string, any> = {};

    sales.forEach((s: any) => {
      const empId = s.user?.employeeId ?? 'unknown';
      if (!byEmployee[empId]) {
        byEmployee[empId] = {
          employeeId: empId,
          name: s.user?.employee
            ? `${s.user.employee.firstName} ${s.user.employee.lastName}`
            : 'Unknown',
          position: s.user?.employee?.position,
          salesCount: 0,
          totalRevenue: 0,
        };
      }
      byEmployee[empId].salesCount++;
      byEmployee[empId].totalRevenue += this.dec(s.totalAmount);
    });

    const report = {
      reportType: 'EMPLOYEE_PERFORMANCE',
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      employees: Object.values(byEmployee),
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Customer Transactions Report
  async getCustomerTransactionsReport(
    customerId: string,
    from?: string,
    to?: string,
    format?: 'json' | 'pdf' | 'excel',
  ) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const [customer, sales, receivables] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: customerId } }),

      this.prisma.sale.findMany({
        where: {
          customerId,
          saleDate: { gte: fromDate, lte: toDate },
        },
        orderBy: { saleDate: 'desc' },
      }),

      this.prisma.accountsReceivable.findMany({
        where: { customerId },
        include: { installments: true },
      }),
    ]);

    if (!customer) throw new NotFoundException('Customer not found');

    const report = {
      reportType: 'CUSTOMER_TRANSACTIONS',
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      customer: {
        id: customer.id,
        name: customer.businessName || `${customer.firstName} ${customer.lastName}`,
        code: customer.code,
      },
      totalPurchases: sales.reduce((sum: any, s: any) => sum + this.dec(s.totalAmount), 0),
      outstandingBalance: this.dec(customer.currentBalance),
      sales: sales.map((s: any) => ({
        invoiceNumber: s.invoiceNumber,
        date: s.saleDate,
        total: this.dec(s.totalAmount),
        paid: this.dec(s.paidAmount),
      })),
      receivables: receivables.map((r: any) => ({
        invoiceNumber: r.invoiceNumber,
        amount: this.dec(r.amount),
        remaining: this.dec(r.remainingAmount),
        status: r.status,
      })),
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Product Movement Report
  async getProductMovementReport(
    productId?: string,
    category?: string,
    from?: string,
    to?: string,
    branchId?: string,
    format?: 'json' | 'pdf' | 'excel',
  ) {
    const report = {
      reportType: 'PRODUCT_MOVEMENT',
      message: 'Product movement tracking to be implemented',
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Gold Price Impact Report
  async getGoldPriceImpactReport(from?: string, to?: string, format?: 'json' | 'pdf' | 'excel') {
    const report = {
      reportType: 'GOLD_PRICE_IMPACT',
      message: 'Gold price impact analysis to be implemented',
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Workshop Performance Report
  async getWorkshopPerformanceReport(
    workshopId?: string,
    from?: string,
    to?: string,
    format?: 'json' | 'pdf' | 'excel',
  ) {
    const report = {
      reportType: 'WORKSHOP_PERFORMANCE',
      message: 'Workshop performance tracking to be implemented',
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Custom Report
  async getCustomReport(reportId: string, params: any, format?: 'json' | 'pdf' | 'excel') {
    const report = {
      reportType: 'CUSTOM',
      reportId,
      params,
      message: 'Custom report builder to be implemented',
    };

    return format === 'json' ? report : this.formatReport(report, format);
  }

  // Export Report
  async exportReport(format: 'pdf' | 'excel' | 'csv', params: any, res?: Response) {
    // Implementation for export functionality
    return { message: `Export as ${format} to be implemented`, params };
  }

  // Helper methods

  private parseDateRange(from?: string, to?: string): { fromDate: Date; toDate: Date } {
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
    const toDate = to ? new Date(to) : new Date();
    toDate.setHours(23, 59, 59, 999);
    return { fromDate, toDate };
  }

  private dec(value: any): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof (value as any).toNumber === 'function') {
      try {
        return (value as any).toNumber();
      } catch {
        return 0;
      }
    }
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }

  private formatReport(report: any, format?: 'pdf' | 'excel') {
    // Placeholder for PDF/Excel formatting
    return {
      ...report,
      format: format ?? 'json',
      message: `Formatting as ${format} to be implemented`,
    };
  }
}