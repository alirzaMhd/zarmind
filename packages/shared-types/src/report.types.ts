// ===================================
// Generic Report Structure
// ===================================

interface IReportHeader {
  reportType: string;
  generatedAt: Date;
  period?: { from: Date; to: Date };
  asOf?: Date;
  branchId?: string | 'ALL';
  currency?: string;
}

// ===================================
// Financial Reports
// ===================================

export interface IProfitLossReport extends IReportHeader {
  reportType: 'PROFIT_LOSS';
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: number;
  netProfit: number;
  netProfitMargin: number;
  details: {
    salesSubtotal: number;
    salesTax: number;
    salesDiscount: number;
    purchasesSubtotal: number;
    purchasesTax: number;
  };
}

export interface IBalanceSheetReport extends IReportHeader {
  reportType: 'BALANCE_SHEET';
  assets: {
    cash: number;
    bankAccounts: number;
    accountsReceivable: number;
    inventory: number;
    total: number;
  };
  liabilities: {
    accountsPayable: number;
    total: number;
  };
  equity: {
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
}

export interface ICashFlowReport extends IReportHeader {
  reportType: 'CASH_FLOW';
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
}

export interface ITaxReport extends IReportHeader {
  reportType: 'TAX';
  taxType: string; // e.g., VAT
  salesTaxCollected: number;
  purchasesTaxPaid: number;
  netTaxLiability: number;
  totalSales: number;
  totalPurchases: number;
}

// ===================================
// Inventory Reports
// ===================================

export interface IInventoryValuationReport extends IReportHeader {
  reportType: 'INVENTORY_VALUATION';
  totalPurchaseValue: number;
  totalSellingValue: number;
  totalPotentialProfit: number;
  byCategory: Array<{
    category: string;
    count: number;
    quantity: number;
    totalWeight?: number;
    purchaseValue: number;
    sellingValue: number;
    potentialProfit: number;
  }>;
}

// ===================================
// Transaction Reports
// ===================================

export interface ISalesReport extends IReportHeader {
  reportType: 'SALES';
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  sales: Array<{
    id: string;
    invoiceNumber: string;
    date: Date;
    customer?: { id: string; name: string } | null;
    user?: { id: string; name: string } | null;
    items: Array<{
      product: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  }>;
}

export interface IPurchasesReport extends IReportHeader {
  reportType: 'PURCHASES';
  totalPurchases: number;
  totalAmount: number;
  purchases: Array<{
    id: string;
    purchaseNumber: string;
    date: Date;
    supplier?: { id: string; name: string } | null;
    items: Array<{
      product: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
  }>;
}

// ===================================
// Aging Reports
// ===================================

export interface IARAgingReport extends IReportHeader {
  reportType: 'AR_AGING';
  totalReceivables: number;
  receivables: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    customer?: { id: string; name: string } | null;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate?: Date | null;
    status: string;
    daysOverdue: number;
    agingBucket: 'Current' | '1-30 days' | '31-60 days' | '61-90 days' | '90+ days';
  }>;
}

export interface IAPAgingReport extends IReportHeader {
  reportType: 'AP_AGING';
  totalPayables: number;
  payables: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    supplier?: { id: string; name: string } | null;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate?: Date | null;
    status: string;
    daysOverdue: number;
    agingBucket: 'Current' | '1-30 days' | '31-60 days' | '61-90 days' | '90+ days';
  }>;
}