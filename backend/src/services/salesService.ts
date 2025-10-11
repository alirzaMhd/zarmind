// ==========================================
// ZARMIND - Sales Service
// ==========================================

import SaleModel, { ICreateSale, IUpdateSale, ISaleFilter } from '../models/Sale';
import TransactionModel from '../models/Transaction';
import ProductModel from '../models/Product';
import CustomerModel from '../models/Customer';
import AuditLogModel from '../models/AuditLog';
import {
  ISale,
  ISaleWithItems,
  SaleStatus,
  SaleType,
  PaymentMethod,
  TransactionType,
  EntityType,
  NotFoundError,
  ValidationError,
} from '../types';
import logger from '../utils/logger';
import { formatPrice, getCurrentJalaliDate } from '../utils/helpers';

// ==========================================
// INTERFACES
// ==========================================

export interface ISaleCreateData extends ICreateSale {
  // Extends ICreateSale with any additional fields
}

export interface IPaymentData {
  sale_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  processed_by: string;
}

export interface ISalesReport {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  salesCount: number;
  averageSaleAmount: number;
  completedSales: number;
  pendingSales: number;
  cancelledSales: number;
  byPaymentMethod: Record<PaymentMethod, { count: number; amount: number }>;
  bySaleType: Record<SaleType, { count: number; amount: number }>;
  topCustomers: Array<{
    customer_id: string;
    customer_name: string;
    total_amount: number;
    sale_count: number;
  }>;
  dailySales: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}

export interface ISalePerformance {
  today: {
    count: number;
    revenue: number;
    profit: number;
  };
  week: {
    count: number;
    revenue: number;
    profit: number;
  };
  month: {
    count: number;
    revenue: number;
    profit: number;
  };
  year: {
    count: number;
    revenue: number;
    profit: number;
  };
}

export interface IPendingPayment {
  sale_id: string;
  sale_number: string;
  customer_id: string | null;
  customer_name: string | null;
  final_amount: number;
  paid_amount: number;
  remaining_amount: number;
  sale_date: Date;
  days_overdue: number;
}

// ==========================================
// SALES SERVICE
// ==========================================

class SalesService {
  // ==========================================
  // SALE CRUD
  // ==========================================

  /**
   * Create a new sale
   */
  async createSale(
    saleData: ISaleCreateData,
    created_by: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<ISaleWithItems> {
    try {
      // Validate sale data
      await this.validateSaleData(saleData);

      // Validate customer credit limit if applicable
      if (saleData.customer_id) {
        await this.validateCustomerCredit(
          saleData.customer_id,
          saleData.items,
          saleData.gold_price,
          saleData.discount || 0,
          saleData.tax || 0,
          saleData.paid_amount || 0
        );
      }

      // Create sale (this handles stock updates and customer balance in transaction)
      const sale = await SaleModel.create({
        ...saleData,
        created_by,
      });

      // Create transaction record for the sale
      if (saleData.paid_amount && saleData.paid_amount > 0) {
        await TransactionModel.createSaleTransaction(
          sale.id,
          sale.customer_id ?? null,
          saleData.paid_amount,
          saleData.payment_method || PaymentMethod.CASH,
          created_by,
          undefined
        );
      }

      // Log creation
      await AuditLogModel.logCreate(
        created_by,
        EntityType.SALE,
        sale.id,
        sale,
        ip_address,
        user_agent
      );

      logger.info(
        `Sale created: ${sale.sale_number} - Amount: ${formatPrice(sale.final_amount)} by ${created_by}`
      );

      return sale;
    } catch (error) {
      logger.error('Error in createSale:', error);
      throw error;
    }
  }

  /**
   * Get sale by ID
   */
  async getSaleById(
    id: string,
    user_id?: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<ISaleWithItems> {
    const sale = await SaleModel.findByIdWithItems(id);

    if (!sale) {
      throw new NotFoundError('فروش یافت نشد');
    }

    // Log view (optional)
    if (user_id) {
      await AuditLogModel.logView(user_id, EntityType.SALE, id, ip_address, user_agent);
    }

    return sale;
  }

  /**
   * Get sale by sale number
   */
  async getSaleBySaleNumber(sale_number: string): Promise<ISaleWithItems> {
    const sale = await SaleModel.findBySaleNumber(sale_number);

    if (!sale) {
      throw new NotFoundError('فروش یافت نشد');
    }

    const items = await SaleModel.getSaleItems(sale.id);

    return {
      ...sale,
      items,
    };
  }

  /**
   * Get all sales with filters
   */
  async getSales(filters?: ISaleFilter): Promise<ISale[]> {
    return SaleModel.findAll(filters);
  }

  /**
   * Get sales with pagination
   */
  async getSalesWithPagination(page: number = 1, limit: number = 20, filters?: ISaleFilter) {
    return SaleModel.findWithPagination(page, limit, filters);
  }

  /**
   * Get sales by customer
   */
  async getSalesByCustomer(customer_id: string): Promise<ISale[]> {
    return SaleModel.findByCustomer(customer_id);
  }

  /**
   * Update sale
   */
  async updateSale(
    id: string,
    updateData: IUpdateSale,
    updated_by: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<ISale> {
    try {
      // Get old sale for audit
      const oldSale = await SaleModel.findById(id);
      if (!oldSale) {
        throw new NotFoundError('فروش یافت نشد');
      }

      // Don't allow updating completed or cancelled sales
      if (oldSale.status === SaleStatus.COMPLETED) {
        throw new ValidationError('نمی‌توان فروش تکمیل شده را ویرایش کرد');
      }

      if (oldSale.status === SaleStatus.CANCELLED) {
        throw new ValidationError('نمی‌توان فروش لغو شده را ویرایش کرد');
      }

      // Update sale
      const updatedSale = await SaleModel.update(id, updateData);

      // Log update
      await AuditLogModel.logUpdate(
        updated_by,
        EntityType.SALE,
        id,
        oldSale,
        updatedSale,
        ip_address,
        user_agent
      );

      logger.info(`Sale updated: ${updatedSale.sale_number} by ${updated_by}`);

      return updatedSale;
    } catch (error) {
      logger.error('Error in updateSale:', error);
      throw error;
    }
  }

  /**
   * Update sale status
   */
  async updateSaleStatus(
    id: string,
    status: SaleStatus,
    updated_by: string
  ): Promise<ISale> {
    const sale = await SaleModel.findById(id);
    if (!sale) {
      throw new NotFoundError('فروش یافت نشد');
    }

    // Validate status transition
    if (sale.status === SaleStatus.CANCELLED) {
      throw new ValidationError('نمی‌توان وضعیت فروش لغو شده را تغییر داد');
    }

    if (status === SaleStatus.COMPLETED && sale.remaining_amount > 0) {
      throw new ValidationError('برای تکمیل فروش باید مبلغ باقیمانده پرداخت شود');
    }

    const updatedSale = await SaleModel.updateStatus(id, status);

    logger.info(`Sale status updated: ${updatedSale.sale_number} -> ${status}`);

    return updatedSale;
  }

  /**
   * Cancel sale
   */
  async cancelSale(
    id: string,
    cancelled_by: string,
    reason?: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<ISale> {
    try {
      const sale = await SaleModel.findById(id);
      if (!sale) {
        throw new NotFoundError('فروش یافت نشد');
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new ValidationError('این فروش قبلاً لغو شده است');
      }

      // Cancel sale (this reverses stock and customer balance)
      const cancelledSale = await SaleModel.cancel(id, cancelled_by);

      // Log cancellation
      await AuditLogModel.logUpdate(
        cancelled_by,
        EntityType.SALE,
        id,
        { status: sale.status },
        { status: SaleStatus.CANCELLED, reason },
        ip_address,
        user_agent
      );

      logger.warn(`Sale cancelled: ${cancelledSale.sale_number} by ${cancelled_by}${reason ? ` - Reason: ${reason}` : ''}`);

      return cancelledSale;
    } catch (error) {
      logger.error('Error in cancelSale:', error);
      throw error;
    }
  }

  /**
   * Delete sale (only drafts)
   */
  async deleteSale(
    id: string,
    deleted_by: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<void> {
    const sale = await SaleModel.findById(id);
    if (!sale) {
      throw new NotFoundError('فروش یافت نشد');
    }

    if (sale.status !== SaleStatus.DRAFT) {
      throw new ValidationError('فقط پیش‌فاکتورها قابل حذف هستند');
    }

    await SaleModel.hardDelete(id);

    // Log deletion
    await AuditLogModel.logDelete(
      deleted_by,
      EntityType.SALE,
      id,
      sale,
      ip_address,
      user_agent
    );

    logger.info(`Sale deleted: ${sale.sale_number} by ${deleted_by}`);
  }

  // ==========================================
  // PAYMENT MANAGEMENT
  // ==========================================

  /**
   * Add payment to sale
   */
  async addPayment(paymentData: IPaymentData): Promise<ISale> {
    try {
      const { sale_id, amount, payment_method, reference_number, notes, processed_by } =
        paymentData;

      // Validate payment
      if (amount <= 0) {
        throw new ValidationError('مبلغ پرداخت باید مثبت باشد');
      }

      const sale = await SaleModel.findById(sale_id);
      if (!sale) {
        throw new NotFoundError('فروش یافت نشد');
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new ValidationError('نمی‌توان به فروش لغو شده پرداخت افزود');
      }

      if (sale.status === SaleStatus.COMPLETED) {
        throw new ValidationError('این فروش قبلاً تکمیل شده است');
      }

      if (amount > sale.remaining_amount) {
        throw new ValidationError(
          `مبلغ پرداخت (${formatPrice(amount)}) بیشتر از مبلغ باقیمانده (${formatPrice(sale.remaining_amount)}) است`
        );
      }

      // Add payment (this updates sale and customer balance)
      const updatedSale = await SaleModel.addPayment({
        sale_id,
        amount,
        payment_method,
        reference_number,
        payment_date: new Date(),
        created_by: processed_by,
      });

      logger.info(
        `Payment added to sale ${updatedSale.sale_number}: ${formatPrice(amount)}`
      );

      return updatedSale;
    } catch (error) {
      logger.error('Error in addPayment:', error);
      throw error;
    }
  }

  /**
   * Get pending payments
   */
  async getPendingPayments(): Promise<IPendingPayment[]> {
    const pendingSales = await SaleModel.findPending();

    return pendingSales
      .filter((sale) => sale.remaining_amount > 0)
      .map((sale) => {
        const daysOverdue = Math.floor(
          (Date.now() - sale.sale_date.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          sale_id: sale.id,
          sale_number: sale.sale_number,
          customer_id: sale.customer_id ?? null, // ✅ Convert undefined to null
          customer_name: null, // Would need to join with customer
          final_amount: sale.final_amount,
          paid_amount: sale.paid_amount,
          remaining_amount: sale.remaining_amount,
          sale_date: sale.sale_date,
          days_overdue: daysOverdue,
        };
      });
  }

  /**
   * Get overdue payments
   */
  async getOverduePayments(days: number = 30): Promise<IPendingPayment[]> {
    const allPending = await this.getPendingPayments();

    return allPending.filter((payment) => payment.days_overdue > days);
  }

  // ==========================================
  // VALIDATION
  // ==========================================

  /**
   * Validate sale data
   */
  private async validateSaleData(saleData: ICreateSale): Promise<void> {
    // Validate items
    if (!saleData.items || saleData.items.length === 0) {
      throw new ValidationError('حداقل یک محصول باید انتخاب شود');
    }

    // Validate each item's product and stock
    for (const item of saleData.items) {
      const product = await ProductModel.findById(item.product_id);

      if (!product) {
        throw new NotFoundError(`محصول با شناسه ${item.product_id} یافت نشد`);
      }

      if (!product.is_active) {
        throw new ValidationError(`محصول ${product.name} غیرفعال است`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new ValidationError(
          `موجودی ${product.name} کافی نیست (موجودی: ${product.stock_quantity}, درخواستی: ${item.quantity})`
        );
      }
    }

    // Validate amounts
    if (saleData.discount && saleData.discount < 0) {
      throw new ValidationError('تخفیف نمی‌تواند منفی باشد');
    }

    if (saleData.tax && saleData.tax < 0) {
      throw new ValidationError('مالیات نمی‌تواند منفی باشد');
    }

    if (saleData.paid_amount && saleData.paid_amount < 0) {
      throw new ValidationError('مبلغ پرداختی نمی‌تواند منفی باشد');
    }

    // Validate customer exists
    if (saleData.customer_id) {
      const customerExists = await CustomerModel.exists(saleData.customer_id);
      if (!customerExists) {
        throw new NotFoundError('مشتری یافت نشد');
      }
    }

    // Validate gold price
    if (saleData.gold_price <= 0) {
      throw new ValidationError('قیمت طلا باید مثبت باشد');
    }
  }

  /**
   * Validate customer credit limit
   */
  private async validateCustomerCredit(
    customer_id: string,
    items: Array<{ product_id: string; quantity: number }>,
    gold_price: number,
    discount: number,
    tax: number,
    paid_amount: number
  ): Promise<void> {
    const customer = await CustomerModel.findById(customer_id);
    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    // Calculate total amount
    let total = 0;
    for (const item of items) {
      const product = await ProductModel.findById(item.product_id);
      if (product) {
        total += product.selling_price * item.quantity;
      }
    }

    const finalAmount = total - discount + tax;
    const remainingAmount = finalAmount - paid_amount;

    // Check credit limit
    if (customer.credit_limit! > 0 && remainingAmount > 0) {
      const newBalance = customer.balance + remainingAmount;
      if (newBalance > customer.credit_limit!) {
        throw new ValidationError(
          `مبلغ باقیمانده (${formatPrice(remainingAmount)}) از سقف اعتبار مشتری (${formatPrice(customer.credit_limit! - customer.balance)}) بیشتر است`
        );
      }
    }
  }

  // ==========================================
  // REPORTS & STATISTICS
  // ==========================================

  /**
   * Get sales report
   */
  async getSalesReport(startDate?: Date, endDate?: Date): Promise<ISalesReport> {
    try {
      const filters: ISaleFilter = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const sales = await SaleModel.findAll(filters);
      const stats = await SaleModel.getStatistics(startDate, endDate);

      // Calculate profit (would need purchase prices)
      const totalProfit = 0; // Placeholder

      // Group by payment method
      const byPaymentMethod: Record<PaymentMethod, { count: number; amount: number }> = {
        cash: { count: 0, amount: 0 },
        card: { count: 0, amount: 0 },
        transfer: { count: 0, amount: 0 },
        check: { count: 0, amount: 0 },
        mixed: { count: 0, amount: 0 },
      };

      // Group by sale type
      const bySaleType: Record<SaleType, { count: number; amount: number }> = {
        cash: { count: 0, amount: 0 },
        installment: { count: 0, amount: 0 },
        exchange: { count: 0, amount: 0 },
        repair: { count: 0, amount: 0 },
      };

      sales.forEach((sale) => {
        byPaymentMethod[sale.payment_method].count++;
        byPaymentMethod[sale.payment_method].amount += sale.final_amount;

        bySaleType[sale.sale_type].count++;
        bySaleType[sale.sale_type].amount += sale.final_amount;
      });

      // Top customers (placeholder - would need aggregation)
      const topCustomers: Array<{
        customer_id: string;
        customer_name: string;
        total_amount: number;
        sale_count: number;
      }> = [];

      // Daily sales (last 7 days)
      const dailySales: Array<{ date: string; count: number; amount: number }> = [];

      return {
        totalSales: stats.totalAmount,
        totalRevenue: stats.totalRevenue,
        totalProfit,
        salesCount: stats.total,
        averageSaleAmount: stats.averageSaleAmount,
        completedSales: stats.completed,
        pendingSales: stats.pending,
        cancelledSales: stats.cancelled,
        byPaymentMethod,
        bySaleType,
        topCustomers,
        dailySales,
      };
    } catch (error) {
      logger.error('Error in getSalesReport:', error);
      throw error;
    }
  }

  /**
   * Get sales performance
   */
  async getSalesPerformance(): Promise<ISalePerformance> {
    const { query } = require('../config/database');

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
      today: {
        count: parseInt(todayResult.rows[0]?.count || '0', 10),
        revenue: parseFloat(todayResult.rows[0]?.revenue || '0'),
        profit: 0, // Placeholder
      },
      week: {
        count: parseInt(weekResult.rows[0]?.count || '0', 10),
        revenue: parseFloat(weekResult.rows[0]?.revenue || '0'),
        profit: 0,
      },
      month: {
        count: parseInt(monthResult.rows[0]?.count || '0', 10),
        revenue: parseFloat(monthResult.rows[0]?.revenue || '0'),
        profit: 0,
      },
      year: {
        count: parseInt(yearResult.rows[0]?.count || '0', 10),
        revenue: parseFloat(yearResult.rows[0]?.revenue || '0'),
        profit: 0,
      },
    };
  }

  /**
   * Get today's sales
   */
  async getTodaySales(): Promise<ISale[]> {
    return SaleModel.getTodaySales();
  }

  /**
   * Get today's revenue
   */
  async getTodayRevenue(): Promise<number> {
    return SaleModel.getTodayRevenue();
  }

  /**
   * Get recent sales
   */
  async getRecentSales(limit: number = 10): Promise<ISale[]> {
    return SaleModel.findRecent(limit);
  }

  /**
   * Get sales statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    return SaleModel.getStatistics(startDate, endDate);
  }

  /**
   * Get sales by date range
   */
  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<ISale[]> {
    return SaleModel.findByDateRange(startDate, endDate);
  }

  // ==========================================
  // INVOICE & RECEIPT
  // ==========================================

  /**
   * Generate invoice data
   */
  async generateInvoice(sale_id: string): Promise<{
    sale: ISaleWithItems;
    customer: any;
    storeName: string;
    invoiceDate: string;
  }> {
    const sale = await this.getSaleById(sale_id);

    let customer = null;
    if (sale.customer_id) {
      customer = await CustomerModel.findById(sale.customer_id);
    }

    return {
      sale,
      customer,
      storeName: 'فروشگاه زرمند', // From settings
      invoiceDate: getCurrentJalaliDate(),
    };
  }

  /**
   * Generate receipt data for payment
   */
  async generateReceipt(transaction_id: string) {
    const transaction = await TransactionModel.findById(transaction_id);
    if (!transaction) {
      throw new NotFoundError('تراکنش یافت نشد');
    }

    let sale = null;
    if (transaction.sale_id) {
      sale = await SaleModel.findById(transaction.sale_id);
    }

    let customer = null;
    if (transaction.customer_id) {
      customer = await CustomerModel.findById(transaction.customer_id);
    }

    return {
      transaction,
      sale,
      customer,
      storeName: 'فروشگاه زرمند',
      receiptDate: getCurrentJalaliDate(),
    };
  }

  // ==========================================
  // ANALYTICS
  // ==========================================

  /**
   * Get best selling products
   */
  async getBestSellingProducts(limit: number = 10, startDate?: Date, endDate?: Date) {
    const { query } = require('../config/database');

    let whereClause = '';
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause = 'WHERE s.sale_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT 
        si.product_id,
        si.product_name,
        SUM(si.quantity) as total_quantity,
        SUM(si.total_price) as total_revenue,
        COUNT(DISTINCT si.sale_id) as sale_count
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       ${whereClause}
       GROUP BY si.product_id, si.product_name
       ORDER BY total_quantity DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    return result.rows;
  }

  /**
   * Get sales trend (daily/weekly/monthly)
   */
  async getSalesTrend(period: 'daily' | 'weekly' | 'monthly', days: number = 30) {
    const { query } = require('../config/database');

    let dateFormat = 'YYYY-MM-DD';
    if (period === 'weekly') dateFormat = 'IYYY-IW';
    if (period === 'monthly') dateFormat = 'YYYY-MM';

    const result = await query(
      `SELECT 
        TO_CHAR(sale_date, '${dateFormat}') as period,
        COUNT(*) as count,
        SUM(final_amount) as amount
       FROM sales
       WHERE sale_date >= NOW() - INTERVAL '${days} days'
       AND status IN ('completed', 'partial')
       GROUP BY period
       ORDER BY period ASC`
    );

    return result.rows;
  }

  /**
   * Get sales conversion rate (drafts to completed)
   */
  async getConversionRate(startDate?: Date, endDate?: Date): Promise<{
    totalDrafts: number;
    completed: number;
    conversionRate: number;
  }> {
    const filters: ISaleFilter = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const sales = await SaleModel.findAll(filters);

    const totalDrafts = sales.filter((s) => s.status === SaleStatus.DRAFT).length;
    const completed = sales.filter((s) => s.status === SaleStatus.COMPLETED).length;

    return {
      totalDrafts,
      completed,
      conversionRate: totalDrafts > 0 ? (completed / totalDrafts) * 100 : 0,
    };
  }
}

// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================

export default new SalesService();