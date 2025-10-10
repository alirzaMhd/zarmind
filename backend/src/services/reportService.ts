// ==========================================
// ZARMIND - Report Service
// ==========================================

import ProductModel from '../models/Product';
import CustomerModel from '../models/Customer';
import SaleModel from '../models/Sale';
import TransactionModel from '../models/Transaction';
import {
  ProductCategory,
  ProductType,
  SaleStatus,
  PaymentMethod,
  TransactionType,
} from '../types';
import logger from '../utils/logger';
import {
  formatPrice,
  formatWeight,
  getPercentage,
  percentageChange,
  toJalaliDate,
} from '../utils/helpers';
import { query } from '../config/database';

// ==========================================
// INTERFACES
// ==========================================

export interface IDateRange {
  startDate: Date;
  endDate: Date;
}

export interface IDashboardStats {
  sales: {
    today: number;
    todayRevenue: number;
    week: number;
    weekRevenue: number;
    month: number;
    monthRevenue: number;
    year: number;
    yearRevenue: number;
  };
  inventory: {
    totalProducts: number;
    totalValue: number;
    totalWeight: number;
    lowStock: number;
    outOfStock: number;
  };
  customers: {
    total: number;
    active: number;
    new: number;
    withDebt: number;
    totalDebt: number;
  };
  transactions: {
    today: number;
    todayAmount: number;
    pending: number;
    pendingAmount: number;
  };
  recentSales: any[];
  recentCustomers: any[];
  stockAlerts: any[];
  pendingPayments: any[];
}

export interface ISalesReport {
  period: string;
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  salesCount: number;
  averageSaleValue: number;
  completedSales: number;
  pendingSales: number;
  cancelledSales: number;
  byCategory: Array<{
    category: ProductCategory;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  byPaymentMethod: Array<{
    method: PaymentMethod;
    count: number;
    amount: number;
    percentage: number;
  }>;
  topProducts: Array<{
    product_id: string;
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    customer_id: string;
    customer_name: string;
    sale_count: number;
    total_amount: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    sales_count: number;
    revenue: number;
  }>;
}

export interface IInventoryReport {
  totalProducts: number;
  totalValue: number;
  totalWeight: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  byCategory: Array<{
    category: ProductCategory;
    count: number;
    value: number;
    weight: number;
    percentage: number;
  }>;
  byType: Array<{
    type: ProductType;
    count: number;
    value: number;
    percentage: number;
  }>;
  byCarat: Array<{
    carat: number;
    count: number;
    weight: number;
    value: number;
  }>;
  topValueProducts: any[];
  lowStockProducts: any[];
  outOfStockProducts: any[];
  inventoryTurnover?: number;
}

export interface ICustomerReport {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  inactiveCustomers: number;
  customersWithDebt: number;
  customersWithCredit: number;
  totalDebt: number;
  totalCredit: number;
  totalPurchases: number;
  averagePurchasePerCustomer: number;
  topCustomers: any[];
  customersByCity: Array<{
    city: string;
    count: number;
    percentage: number;
  }>;
  customerSegmentation: {
    vip: number;
    regular: number;
    occasional: number;
    inactive: number;
  };
  retentionRate: number;
}

export interface IFinancialReport {
  period: string;
  revenue: {
    sales: number;
    payments: number;
    total: number;
  };
  expenses: {
    purchases: number;
    returns: number;
    otherExpenses: number;
    total: number;
  };
  netIncome: number;
  cashFlow: {
    inflow: number;
    outflow: number;
    net: number;
  };
  byPaymentMethod: Array<{
    method: PaymentMethod;
    amount: number;
    percentage: number;
  }>;
  accountsReceivable: number;
  accountsPayable: number;
}

export interface IProfitLossReport {
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: number;
  operatingIncome: number;
  netIncome: number;
  netProfitMargin: number;
}

export interface IGoldPriceTrend {
  carat: number;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercentage: number;
  history: Array<{
    date: string;
    price: number;
  }>;
}

export interface IComparativeReport {
  currentPeriod: ISalesReport;
  previousPeriod: ISalesReport;
  comparison: {
    salesGrowth: number;
    revenueGrowth: number;
    profitGrowth: number;
    averageValueGrowth: number;
  };
}

// ==========================================
// REPORT SERVICE
// ==========================================

class ReportService {
  // ==========================================
  // DASHBOARD
  // ==========================================

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<IDashboardStats> {
    try {
      const [
        salesStats,
        inventoryStats,
        customerStats,
        transactionStats,
        recentSales,
        recentCustomers,
        stockAlerts,
        pendingPayments,
      ] = await Promise.all([
        this.getSalesStats(),
        this.getInventoryStats(),
        this.getCustomerStats(),
        this.getTransactionStats(),
        SaleModel.findRecent(5),
        this.getRecentCustomers(5),
        ProductModel.findLowStock(),
        this.getPendingPaymentsSummary(),
      ]);

      return {
        sales: salesStats,
        inventory: inventoryStats,
        customers: customerStats,
        transactions: transactionStats,
        recentSales,
        recentCustomers,
        stockAlerts: stockAlerts.slice(0, 5),
        pendingPayments: pendingPayments.slice(0, 5),
      };
    } catch (error) {
      logger.error('Error in getDashboardStats:', error);
      throw error;
    }
  }

  /**
   * Get sales statistics for dashboard
   */
  private async getSalesStats() {
    const [todayResult, weekResult, monthResult, yearResult] = await Promise.all([
      query(
        `SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue 
         FROM sales 
         WHERE DATE(sale_date) = CURRENT_DATE 
         AND status IN ('completed', 'partial')`
      ),
      query(
        `SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue 
         FROM sales 
         WHERE sale_date >= NOW() - INTERVAL '7 days' 
         AND status IN ('completed', 'partial')`
      ),
      query(
        `SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue 
         FROM sales 
         WHERE DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', CURRENT_DATE)
         AND status IN ('completed', 'partial')`
      ),
      query(
        `SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue 
         FROM sales 
         WHERE DATE_TRUNC('year', sale_date) = DATE_TRUNC('year', CURRENT_DATE)
         AND status IN ('completed', 'partial')`
      ),
    ]);

    return {
      today: parseInt(todayResult.rows[0]?.count || '0', 10),
      todayRevenue: parseFloat(todayResult.rows[0]?.revenue || '0'),
      week: parseInt(weekResult.rows[0]?.count || '0', 10),
      weekRevenue: parseFloat(weekResult.rows[0]?.revenue || '0'),
      month: parseInt(monthResult.rows[0]?.count || '0', 10),
      monthRevenue: parseFloat(monthResult.rows[0]?.revenue || '0'),
      year: parseInt(yearResult.rows[0]?.count || '0', 10),
      yearRevenue: parseFloat(yearResult.rows[0]?.revenue || '0'),
    };
  }

  /**
   * Get inventory statistics for dashboard
   */
  private async getInventoryStats() {
    const stats = await ProductModel.getStatistics();

    return {
      totalProducts: stats.total,
      totalValue: stats.totalValue,
      totalWeight: stats.totalWeight,
      lowStock: stats.lowStock,
      outOfStock: stats.outOfStock,
    };
  }

  /**
   * Get customer statistics for dashboard
   */
  private async getCustomerStats() {
    const [stats, newCustomersResult] = await Promise.all([
      CustomerModel.getStatistics(),
      query(
        `SELECT COUNT(*) as count FROM customers 
         WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
      ),
    ]);

    return {
      total: stats.total,
      active: stats.active,
      new: parseInt(newCustomersResult.rows[0]?.count || '0', 10),
      withDebt: stats.withDebt,
      totalDebt: stats.totalDebt,
    };
  }

  /**
   * Get transaction statistics for dashboard
   */
  private async getTransactionStats() {
    const [todayResult, pendingResult] = await Promise.all([
      query(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount 
         FROM transactions 
         WHERE DATE(transaction_date) = CURRENT_DATE`
      ),
      query(
        `SELECT COUNT(*) as count, COALESCE(SUM(remaining_amount), 0) as amount 
         FROM sales 
         WHERE status IN ('draft', 'partial') 
         AND remaining_amount > 0`
      ),
    ]);

    return {
      today: parseInt(todayResult.rows[0]?.count || '0', 10),
      todayAmount: parseFloat(todayResult.rows[0]?.amount || '0'),
      pending: parseInt(pendingResult.rows[0]?.count || '0', 10),
      pendingAmount: parseFloat(pendingResult.rows[0]?.amount || '0'),
    };
  }

  /**
   * Get recent customers
   */
  private async getRecentCustomers(limit: number = 5) {
    const result = await query(
      `SELECT * FROM customers 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Get pending payments summary
   */
  private async getPendingPaymentsSummary() {
    const result = await query(
      `SELECT 
        s.id,
        s.sale_number,
        s.customer_id,
        c.full_name as customer_name,
        s.final_amount,
        s.paid_amount,
        s.remaining_amount,
        s.sale_date,
        CURRENT_DATE - DATE(s.sale_date) as days_overdue
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.status IN ('draft', 'partial') 
       AND s.remaining_amount > 0
       ORDER BY s.sale_date ASC
       LIMIT 10`
    );

    return result.rows;
  }

  // ==========================================
  // SALES REPORTS
  // ==========================================

  /**
   * Generate comprehensive sales report
   */
  async getSalesReport(dateRange?: IDateRange): Promise<ISalesReport> {
    try {
      const startDate = dateRange?.startDate;
      const endDate = dateRange?.endDate;

      const [sales, stats, byCategory, byPayment, topProducts, topCustomers, dailyBreakdown] =
        await Promise.all([
          this.getSalesInPeriod(startDate, endDate),
          SaleModel.getStatistics(startDate, endDate),
          this.getSalesByCategory(startDate, endDate),
          this.getSalesByPaymentMethod(startDate, endDate),
          this.getTopSellingProducts(10, startDate, endDate),
          this.getTopCustomers(10, startDate, endDate),
          this.getDailySalesBreakdown(startDate, endDate),
        ]);

      const totalRevenue = stats.totalAmount;
      const totalCost = 0; // Would need purchase prices
      const grossProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      const period = this.formatPeriod(startDate, endDate);

      return {
        period,
        totalSales: stats.totalAmount,
        totalRevenue: stats.totalRevenue,
        totalCost,
        grossProfit,
        profitMargin,
        salesCount: stats.total,
        averageSaleValue: stats.averageSaleAmount,
        completedSales: stats.completed,
        pendingSales: stats.pending,
        cancelledSales: stats.cancelled,
        byCategory,
        byPaymentMethod: byPayment,
        topProducts,
        topCustomers,
        dailyBreakdown,
      };
    } catch (error) {
      logger.error('Error in getSalesReport:', error);
      throw error;
    }
  }

  /**
   * Get sales in period
   */
  private async getSalesInPeriod(startDate?: Date, endDate?: Date) {
    let whereClause = "WHERE status IN ('completed', 'partial')";
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause += ' AND sale_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const result = await query(`SELECT * FROM sales ${whereClause}`, params);
    return result.rows;
  }

  /**
   * Get sales by category
   */
  private async getSalesByCategory(startDate?: Date, endDate?: Date) {
    let whereClause = "WHERE s.status IN ('completed', 'partial')";
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause += ' AND s.sale_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT 
        p.category,
        COUNT(DISTINCT s.id) as count,
        SUM(si.total_price) as revenue
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       ${whereClause}
       GROUP BY p.category
       ORDER BY revenue DESC`,
      params
    );

    const total = result.rows.reduce((sum, row) => sum + parseFloat(row.revenue), 0);

    return result.rows.map((row) => ({
      category: row.category,
      count: parseInt(row.count, 10),
      revenue: parseFloat(row.revenue),
      percentage: total > 0 ? (parseFloat(row.revenue) / total) * 100 : 0,
    }));
  }

  /**
   * Get sales by payment method
   */
  private async getSalesByPaymentMethod(startDate?: Date, endDate?: Date) {
    let whereClause = "WHERE status IN ('completed', 'partial')";
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause += ' AND sale_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT 
        payment_method as method,
        COUNT(*) as count,
        SUM(final_amount) as amount
       FROM sales
       ${whereClause}
       GROUP BY payment_method
       ORDER BY amount DESC`,
      params
    );

    const total = result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);

    return result.rows.map((row) => ({
      method: row.method,
      count: parseInt(row.count, 10),
      amount: parseFloat(row.amount),
      percentage: total > 0 ? (parseFloat(row.amount) / total) * 100 : 0,
    }));
  }

  /**
   * Get top selling products
   */
  private async getTopSellingProducts(limit: number = 10, startDate?: Date, endDate?: Date) {
    let whereClause = "WHERE s.status IN ('completed', 'partial')";
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause += ' AND s.sale_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    params.push(limit);

    const result = await query(
      `SELECT 
        si.product_id,
        si.product_name,
        SUM(si.quantity) as quantity_sold,
        SUM(si.total_price) as revenue
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       ${whereClause}
       GROUP BY si.product_id, si.product_name
       ORDER BY quantity_sold DESC
       LIMIT $${params.length}`,
      params
    );

    return result.rows.map((row) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      quantity_sold: parseInt(row.quantity_sold, 10),
      revenue: parseFloat(row.revenue),
    }));
  }

  /**
   * Get top customers
   */
  private async getTopCustomers(limit: number = 10, startDate?: Date, endDate?: Date) {
    let whereClause = "WHERE s.status IN ('completed', 'partial') AND s.customer_id IS NOT NULL";
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause += ' AND s.sale_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    params.push(limit);

    const result = await query(
      `SELECT 
        c.id as customer_id,
        c.full_name as customer_name,
        COUNT(s.id) as sale_count,
        SUM(s.final_amount) as total_amount
       FROM sales s
       JOIN customers c ON s.customer_id = c.id
       ${whereClause}
       GROUP BY c.id, c.full_name
       ORDER BY total_amount DESC
       LIMIT $${params.length}`,
      params
    );

    return result.rows.map((row) => ({
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      sale_count: parseInt(row.sale_count, 10),
      total_amount: parseFloat(row.total_amount),
    }));
  }

  /**
   * Get daily sales breakdown
   */
  private async getDailySalesBreakdown(startDate?: Date, endDate?: Date) {
    let whereClause = "WHERE status IN ('completed', 'partial')";
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause += ' AND sale_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    } else {
      // Default to last 30 days
      whereClause += " AND sale_date >= NOW() - INTERVAL '30 days'";
    }

    const result = await query(
      `SELECT 
        DATE(sale_date) as date,
        COUNT(*) as sales_count,
        SUM(final_amount) as revenue
       FROM sales
       ${whereClause}
       GROUP BY DATE(sale_date)
       ORDER BY date ASC`,
      params
    );

    return result.rows.map((row) => ({
      date: toJalaliDate(row.date),
      sales_count: parseInt(row.sales_count, 10),
      revenue: parseFloat(row.revenue),
    }));
  }

  // ==========================================
  // INVENTORY REPORTS
  // ==========================================

  /**
   * Generate comprehensive inventory report
   */
  async getInventoryReport(): Promise<IInventoryReport> {
    try {
      const stats = await ProductModel.getStatistics();
      const products = await ProductModel.findAll({ isActive: true });

      // By category
      const byCategory = Object.entries(stats.byCategory).map(([category, count]) => {
        const categoryProducts = products.filter((p) => p.category === category);
        const value = categoryProducts.reduce(
          (sum, p) => sum + p.selling_price * p.stock_quantity,
          0
        );
        const weight = categoryProducts.reduce((sum, p) => sum + p.weight * p.stock_quantity, 0);

        return {
          category: category as ProductCategory,
          count,
          value,
          weight,
          percentage: stats.total > 0 ? (count / stats.total) * 100 : 0,
        };
      });

      // By type
      const byType = Object.entries(stats.byType).map(([type, count]) => {
        const typeProducts = products.filter((p) => p.type === type);
        const value = typeProducts.reduce(
          (sum, p) => sum + p.selling_price * p.stock_quantity,
          0
        );

        return {
          type: type as ProductType,
          count,
          value,
          percentage: stats.total > 0 ? (count / stats.total) * 100 : 0,
        };
      });

      // By carat
      const byCarat = await this.getInventoryByCarat();

      // Top value products
      const topValueProducts = products
        .map((p) => ({
          ...p,
          total_value: p.selling_price * p.stock_quantity,
        }))
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, 10);

      // Low stock and out of stock
      const lowStockProducts = await ProductModel.findLowStock();
      const outOfStockProducts = await ProductModel.findOutOfStock();

      return {
        totalProducts: stats.total,
        totalValue: stats.totalValue,
        totalWeight: stats.totalWeight,
        activeProducts: stats.active,
        inactiveProducts: stats.inactive,
        lowStockItems: stats.lowStock,
        outOfStockItems: stats.outOfStock,
        byCategory,
        byType,
        byCarat,
        topValueProducts,
        lowStockProducts,
        outOfStockProducts,
      };
    } catch (error) {
      logger.error('Error in getInventoryReport:', error);
      throw error;
    }
  }

  /**
   * Get inventory by carat
   */
  private async getInventoryByCarat() {
    const result = await query(
      `SELECT 
        carat,
        COUNT(*) as count,
        SUM(weight * stock_quantity) as weight,
        SUM(selling_price * stock_quantity) as value
       FROM products
       WHERE is_active = true
       GROUP BY carat
       ORDER BY carat DESC`
    );

    return result.rows.map((row) => ({
      carat: row.carat,
      count: parseInt(row.count, 10),
      weight: parseFloat(row.weight || '0'),
      value: parseFloat(row.value || '0'),
    }));
  }

  // ==========================================
  // CUSTOMER REPORTS
  // ==========================================

  /**
   * Generate comprehensive customer report
   */
  async getCustomerReport(): Promise<ICustomerReport> {
    try {
      const stats = await CustomerModel.getStatistics();

      const [
        topCustomers,
        customersByCity,
        segmentation,
        retentionResult,
        newCustomersResult,
        inactiveCustomersResult,
      ] = await Promise.all([
        CustomerModel.getTopCustomers(10),
        this.getCustomersByCity(),
        this.getCustomerSegmentation(),
        this.getCustomerRetentionRate(),
        query(
          `SELECT COUNT(*) as count FROM customers 
           WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
        ),
        query(
          `SELECT COUNT(*) as count FROM customers 
           WHERE is_active = true 
           AND (last_purchase_date IS NULL OR last_purchase_date < NOW() - INTERVAL '90 days')`
        ),
      ]);

      return {
        totalCustomers: stats.total,
        activeCustomers: stats.active,
        newCustomers: parseInt(newCustomersResult.rows[0]?.count || '0', 10),
        inactiveCustomers: parseInt(inactiveCustomersResult.rows[0]?.count || '0', 10),
        customersWithDebt: stats.withDebt,
        customersWithCredit: stats.withCredit,
        totalDebt: stats.totalDebt,
        totalCredit: stats.totalCredit,
        totalPurchases: stats.totalPurchases,
        averagePurchasePerCustomer:
          stats.active > 0 ? stats.totalPurchases / stats.active : 0,
        topCustomers,
        customersByCity,
        customerSegmentation: segmentation,
        retentionRate: retentionResult,
      };
    } catch (error) {
      logger.error('Error in getCustomerReport:', error);
      throw error;
    }
  }

  /**
   * Get customers by city
   */
  private async getCustomersByCity() {
    const result = await query(
      `SELECT 
        city,
        COUNT(*) as count
       FROM customers
       WHERE city IS NOT NULL AND is_active = true
       GROUP BY city
       ORDER BY count DESC
       LIMIT 10`
    );

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);

    return result.rows.map((row) => ({
      city: row.city,
      count: parseInt(row.count, 10),
      percentage: total > 0 ? (parseInt(row.count, 10) / total) * 100 : 0,
    }));
  }

  /**
   * Get customer segmentation
   */
  private async getCustomerSegmentation() {
    const [vipResult, regularResult, occasionalResult, inactiveResult] = await Promise.all([
      query(
        `SELECT COUNT(*) as count FROM customers 
         WHERE total_purchases > 50000000 AND is_active = true`
      ),
      query(
        `SELECT COUNT(*) as count FROM customers 
         WHERE total_purchases BETWEEN 10000000 AND 50000000 AND is_active = true`
      ),
      query(
        `SELECT COUNT(*) as count FROM customers 
         WHERE total_purchases BETWEEN 1 AND 10000000 AND is_active = true`
      ),
      query(
        `SELECT COUNT(*) as count FROM customers 
         WHERE is_active = true 
         AND (last_purchase_date IS NULL OR last_purchase_date < NOW() - INTERVAL '90 days')`
      ),
    ]);

    return {
      vip: parseInt(vipResult.rows[0]?.count || '0', 10),
      regular: parseInt(regularResult.rows[0]?.count || '0', 10),
      occasional: parseInt(occasionalResult.rows[0]?.count || '0', 10),
      inactive: parseInt(inactiveResult.rows[0]?.count || '0', 10),
    };
  }

  /**
   * Get customer retention rate
   */
  private async getCustomerRetentionRate(months: number = 3): Promise<number> {
    const result = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN last_purchase_date >= NOW() - INTERVAL '${months} months' THEN 1 ELSE 0 END) as active
       FROM customers 
       WHERE is_active = true 
       AND created_at < NOW() - INTERVAL '${months} months'`
    );

    const total = parseInt(result.rows[0]?.total || '0', 10);
    const active = parseInt(result.rows[0]?.active || '0', 10);

    return total > 0 ? (active / total) * 100 : 0;
  }

  // ==========================================
  // FINANCIAL REPORTS
  // ==========================================

  /**
   * Generate financial report
   */
  async getFinancialReport(dateRange?: IDateRange): Promise<IFinancialReport> {
    try {
      const startDate = dateRange?.startDate;
      const endDate = dateRange?.endDate;

      const [revenue, expenses, cashFlow, byPaymentMethod, accountsReceivable] =
        await Promise.all([
          this.getRevenue(startDate, endDate),
          this.getExpenses(startDate, endDate),
          this.getCashFlow(startDate, endDate),
          this.getTransactionsByPaymentMethod(startDate, endDate),
          this.getAccountsReceivable(),
        ]);

      const period = this.formatPeriod(startDate, endDate);

      return {
        period,
        revenue,
        expenses,
        netIncome: revenue.total - expenses.total,
        cashFlow,
        byPaymentMethod,
        accountsReceivable,
        accountsPayable: 0, // Placeholder
      };
    } catch (error) {
      logger.error('Error in getFinancialReport:', error);
      throw error;
    }
  }

  /**
   * Get revenue breakdown
   */
  private async getRevenue(startDate?: Date, endDate?: Date) {
    let whereClause = '';
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause = 'WHERE transaction_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT 
        SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END) as sales,
        SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END) as payments
       FROM transactions
       ${whereClause}`,
      params
    );

    const sales = parseFloat(result.rows[0]?.sales || '0');
    const payments = parseFloat(result.rows[0]?.payments || '0');

    return {
      sales,
      payments,
      total: sales + payments,
    };
  }

  /**
   * Get expenses breakdown
   */
  private async getExpenses(startDate?: Date, endDate?: Date) {
    let whereClause = '';
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause = 'WHERE transaction_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT 
        SUM(CASE WHEN type = 'purchase' THEN amount ELSE 0 END) as purchases,
        SUM(CASE WHEN type = 'return' THEN amount ELSE 0 END) as returns,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as other_expenses
       FROM transactions
       ${whereClause}`,
      params
    );

    const purchases = parseFloat(result.rows[0]?.purchases || '0');
    const returns = parseFloat(result.rows[0]?.returns || '0');
    const otherExpenses = parseFloat(result.rows[0]?.other_expenses || '0');

    return {
      purchases,
      returns,
      otherExpenses,
      total: purchases + returns + otherExpenses,
    };
  }

  /**
   * Get cash flow
   */
  private async getCashFlow(startDate?: Date, endDate?: Date) {
    const cashFlow = await TransactionModel.getCashFlow(startDate, endDate);

    return {
      inflow: cashFlow.income,
      outflow: cashFlow.expense,
      net: cashFlow.netCashFlow,
    };
  }

  /**
   * Get transactions by payment method
   */
  private async getTransactionsByPaymentMethod(startDate?: Date, endDate?: Date) {
    let whereClause = '';
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause = 'WHERE transaction_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT 
        payment_method as method,
        SUM(amount) as amount
       FROM transactions
       ${whereClause}
       GROUP BY payment_method
       ORDER BY amount DESC`,
      params
    );

    const total = result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);

    return result.rows.map((row) => ({
      method: row.method,
      amount: parseFloat(row.amount),
      percentage: total > 0 ? (parseFloat(row.amount) / total) * 100 : 0,
    }));
  }

  /**
   * Get accounts receivable
   */
  private async getAccountsReceivable() {
    const result = await query(
      `SELECT COALESCE(SUM(remaining_amount), 0) as total
       FROM sales
       WHERE status IN ('draft', 'partial') 
       AND remaining_amount > 0`
    );

    return parseFloat(result.rows[0]?.total || '0');
  }

  // ==========================================
  // PROFIT & LOSS
  // ==========================================

  /**
   * Generate profit & loss report
   */
  async getProfitLossReport(dateRange?: IDateRange): Promise<IProfitLossReport> {
    const startDate = dateRange?.startDate;
    const endDate = dateRange?.endDate;

    const revenue = await this.getTotalRevenue(startDate, endDate);
    const costOfGoodsSold = 0; // Would need purchase prices
    const grossProfit = revenue - costOfGoodsSold;
    const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const operatingExpenses = await this.getOperatingExpenses(startDate, endDate);
    const operatingIncome = grossProfit - operatingExpenses;
    const netIncome = operatingIncome;
    const netProfitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

    return {
      period: this.formatPeriod(startDate, endDate),
      revenue,
      costOfGoodsSold,
      grossProfit,
      grossProfitMargin,
      operatingExpenses,
      operatingIncome,
      netIncome,
      netProfitMargin,
    };
  }

  /**
   * Get total revenue
   */
  private async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    let whereClause = "WHERE status IN ('completed', 'partial')";
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause += ' AND sale_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT COALESCE(SUM(final_amount), 0) as total FROM sales ${whereClause}`,
      params
    );

    return parseFloat(result.rows[0]?.total || '0');
  }

  /**
   * Get operating expenses
   */
  private async getOperatingExpenses(startDate?: Date, endDate?: Date): Promise<number> {
    let whereClause = "WHERE type = 'expense'";
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause += ' AND transaction_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions ${whereClause}`,
      params
    );

    return parseFloat(result.rows[0]?.total || '0');
  }

  // ==========================================
  // GOLD PRICE TRENDS
  // ==========================================

  /**
   * Get gold price trend
   */
  async getGoldPriceTrend(carat: number, days: number = 30): Promise<IGoldPriceTrend> {
    const result = await query(
      `SELECT date, price_per_gram
       FROM gold_prices
       WHERE carat = $1
       AND date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date ASC`,
      [carat]
    );

    const history = result.rows.map((row) => ({
      date: toJalaliDate(row.date),
      price: parseFloat(row.price_per_gram),
    }));

    const currentPrice = history.length > 0 ? history[history.length - 1].price : 0;
    const previousPrice = history.length > 1 ? history[history.length - 2].price : currentPrice;
    const change = currentPrice - previousPrice;
    const changePercentage = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

    return {
      carat,
      currentPrice,
      previousPrice,
      change,
      changePercentage,
      history,
    };
  }

  // ==========================================
  // COMPARATIVE REPORTS
  // ==========================================

  /**
   * Get comparative sales report
   */
  async getComparativeSalesReport(
    currentPeriod: IDateRange,
    previousPeriod: IDateRange
  ): Promise<IComparativeReport> {
    const [current, previous] = await Promise.all([
      this.getSalesReport(currentPeriod),
      this.getSalesReport(previousPeriod),
    ]);

    const salesGrowth = percentageChange(previous.salesCount, current.salesCount);
    const revenueGrowth = percentageChange(previous.totalRevenue, current.totalRevenue);
    const profitGrowth = percentageChange(previous.grossProfit, current.grossProfit);
    const averageValueGrowth = percentageChange(
      previous.averageSaleValue,
      current.averageSaleValue
    );

    return {
      currentPeriod: current,
      previousPeriod: previous,
      comparison: {
        salesGrowth,
        revenueGrowth,
        profitGrowth,
        averageValueGrowth,
      },
    };
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Format period string
   */
  private formatPeriod(startDate?: Date, endDate?: Date): string {
    if (!startDate || !endDate) {
      return 'همه زمان‌ها';
    }

    return `${toJalaliDate(startDate)} تا ${toJalaliDate(endDate)}`;
  }

  /**
   * Export report to JSON
   */
  async exportReportToJSON(reportData: any): Promise<string> {
    return JSON.stringify(reportData, null, 2);
  }

  /**
   * Get quick stats (for widgets)
   */
  async getQuickStats() {
    const [todaySales, todayRevenue, pendingPayments, lowStock] = await Promise.all([
      SaleModel.getTodaySales(),
      SaleModel.getTodayRevenue(),
      this.getAccountsReceivable(),
      ProductModel.findLowStock(),
    ]);

    return {
      todaySalesCount: todaySales.length,
      todayRevenue,
      pendingPaymentsAmount: pendingPayments,
      lowStockCount: lowStock.length,
    };
  }
}

// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================

export default new ReportService();