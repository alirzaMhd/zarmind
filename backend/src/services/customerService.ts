// ==========================================
// ZARMIND - Customer Service
// ==========================================

import CustomerModel, { ICreateCustomer, IUpdateCustomer } from '../models/Customer';
import AuditLogModel from '../models/AuditLog';
import {
  ICustomer,
  ICustomerFilter,
  EntityType,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../types';
import logger from '../utils/logger';
import {
  validateNationalId,
  validateMobileNumber,
  validateEmail,
  sanitizePhoneNumber,
  formatPrice,
} from '../utils/helpers';
import { query } from '../config/database';

// ==========================================
// INTERFACES
// ==========================================

export interface ICustomerCreateData extends ICreateCustomer {
  // No additional fields needed
}

export interface IBalanceAdjustment {
  customer_id: string;
  amount: number;
  type: 'increase' | 'decrease' | 'set';
  reason: string;
  adjusted_by: string;
}

export interface ICustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  customersWithDebt: number;
  customersWithCredit: number;
  totalDebt: number;
  totalCredit: number;
  totalPurchases: number;
  averagePurchasePerCustomer: number;
  topCities: Array<{ city: string; count: number }>;
}

export interface ICustomerAccountSummary {
  customer: ICustomer;
  balance: number;
  balanceStatus: 'debtor' | 'creditor' | 'settled'; // بدهکار / طلبکار / تسویه
  totalPurchases: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  lastPurchaseDate: Date | null;
  creditUtilization: number; // Percentage of credit limit used
}

export interface ITopCustomer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  total_purchases: number;
  total_orders: number;
  last_purchase_date: Date | null;
}

export interface IDebtorReport {
  customer_id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  debt_amount: number;
  credit_limit: number | null;
  overdue_amount?: number;
  last_purchase_date: Date | null;
}

// ==========================================
// CUSTOMER SERVICE
// ==========================================

class CustomerService {
  // ==========================================
  // CUSTOMER CRUD
  // ==========================================

  /**
   * Create a new customer
   */
  async createCustomer(
    customerData: ICustomerCreateData,
    created_by: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<ICustomer> {
    try {
      // Validate phone number
      if (!validateMobileNumber(customerData.phone)) {
        throw new ValidationError('شماره تلفن نامعتبر است');
      }

      // Validate email if provided
      if (customerData.email && !validateEmail(customerData.email)) {
        throw new ValidationError('ایمیل نامعتبر است');
      }

      // Validate national ID if provided
      if (customerData.national_id && !validateNationalId(customerData.national_id)) {
        throw new ValidationError('کد ملی نامعتبر است');
      }

      // Create customer
      const customer = await CustomerModel.create(customerData);

      // Log creation
      await AuditLogModel.logCreate(
        created_by,
        EntityType.CUSTOMER,
        customer.id,
        customer,
        ip_address,
        user_agent
      );

      logger.info(
        `Customer created: ${customer.full_name} (${customer.customer_code}) by ${created_by}`
      );

      return customer;
    } catch (error) {
      logger.error('Error in createCustomer:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(
    id: string,
    user_id?: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<ICustomer> {
    const customer = await CustomerModel.findById(id);

    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    // Log view (optional)
    if (user_id) {
      await AuditLogModel.logView(
        user_id,
        EntityType.CUSTOMER,
        id,
        ip_address,
        user_agent
      );
    }

    return customer;
  }

  /**
   * Get customer by code
   */
  async getCustomerByCode(customer_code: string): Promise<ICustomer> {
    const customer = await CustomerModel.findByCode(customer_code);

    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    return customer;
  }

  /**
   * Get customer by phone
   */
  async getCustomerByPhone(phone: string): Promise<ICustomer> {
    const customer = await CustomerModel.findByPhone(phone);

    if (!customer) {
      throw new NotFoundError('مشتری با این شماره تلفن یافت نشد');
    }

    return customer;
  }

  /**
   * Get all customers with filters
   */
  async getCustomers(filters?: ICustomerFilter): Promise<ICustomer[]> {
    return CustomerModel.findAll(filters);
  }

  /**
   * Get customers with pagination
   */
  async getCustomersWithPagination(
    page: number = 1,
    limit: number = 20,
    filters?: ICustomerFilter
  ) {
    return CustomerModel.findWithPagination(page, limit, filters);
  }

  /**
   * Update customer
   */
  async updateCustomer(
    id: string,
    updateData: IUpdateCustomer,
    updated_by: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<ICustomer> {
    try {
      // Get old customer for audit
      const oldCustomer = await CustomerModel.findById(id);
      if (!oldCustomer) {
        throw new NotFoundError('مشتری یافت نشد');
      }

      // Validate phone if being updated
      if (updateData.phone && !validateMobileNumber(updateData.phone)) {
        throw new ValidationError('شماره تلفن نامعتبر است');
      }

      // Validate email if being updated
      if (updateData.email && !validateEmail(updateData.email)) {
        throw new ValidationError('ایمیل نامعتبر است');
      }

      // Validate national ID if being updated
      if (updateData.national_id && !validateNationalId(updateData.national_id)) {
        throw new ValidationError('کد ملی نامعتبر است');
      }

      // Update customer
      const updatedCustomer = await CustomerModel.update(id, updateData);

      // Log update
      await AuditLogModel.logUpdate(
        updated_by,
        EntityType.CUSTOMER,
        id,
        oldCustomer,
        updatedCustomer,
        ip_address,
        user_agent
      );

      logger.info(
        `Customer updated: ${updatedCustomer.full_name} (${updatedCustomer.customer_code}) by ${updated_by}`
      );

      return updatedCustomer;
    } catch (error) {
      logger.error('Error in updateCustomer:', error);
      throw error;
    }
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(
    id: string,
    deleted_by: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<void> {
    const customer = await CustomerModel.findById(id);
    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    // Check if customer has outstanding debt
    if (customer.balance > 0) {
      throw new ValidationError('نمی‌توان مشتری با بدهی را حذف کرد');
    }

    // Soft delete
    await CustomerModel.softDelete(id);

    // Log deletion
    await AuditLogModel.logDelete(
      deleted_by,
      EntityType.CUSTOMER,
      id,
      customer,
      ip_address,
      user_agent
    );

    logger.info(
      `Customer deleted: ${customer.full_name} (${customer.customer_code}) by ${deleted_by}`
    );
  }

  /**
   * Restore deleted customer
   */
  async restoreCustomer(id: string, restored_by: string): Promise<ICustomer> {
    const customer = await CustomerModel.setActiveStatus(id, true);

    logger.info(
      `Customer restored: ${customer.full_name} (${customer.customer_code}) by ${restored_by}`
    );

    return customer;
  }

  // ==========================================
  // BALANCE MANAGEMENT
  // ==========================================

  /**
   * Adjust customer balance
   */
  async adjustBalance(adjustment: IBalanceAdjustment): Promise<ICustomer> {
    try {
      const { customer_id, amount, type, reason, adjusted_by } = adjustment;

      // Get customer for validation
      const customer = await CustomerModel.findById(customer_id);
      if (!customer) {
        throw new NotFoundError('مشتری یافت نشد');
      }

      // Log old balance
      const oldBalance = customer.balance;

      // Update balance
      const updatedCustomer = await CustomerModel.adjustBalance({
        customer_id,
        amount,
        type,
        reason,
        updated_by: adjusted_by,
      });

      // Log balance change
      await AuditLogModel.logUpdate(
        adjusted_by,
        EntityType.CUSTOMER,
        customer_id,
        { balance: oldBalance },
        { balance: updatedCustomer.balance },
        undefined,
        undefined
      );

      logger.info(
        `Customer balance adjusted: ${customer.full_name} - ${type} ${formatPrice(amount)} - Reason: ${reason}`
      );

      return updatedCustomer;
    } catch (error) {
      logger.error('Error in adjustBalance:', error);
      throw error;
    }
  }

  /**
   * Add debt to customer
   */
  async addDebt(
    customer_id: string,
    amount: number,
    adjusted_by: string,
    reason?: string
  ): Promise<ICustomer> {
    return this.adjustBalance({
      customer_id,
      amount,
      type: 'increase',
      reason: reason || 'افزایش بدهی',
      adjusted_by,
    });
  }

  /**
   * Reduce debt (customer payment)
   */
  async reduceDebt(
    customer_id: string,
    amount: number,
    adjusted_by: string,
    reason?: string
  ): Promise<ICustomer> {
    return this.adjustBalance({
      customer_id,
      amount,
      type: 'decrease',
      reason: reason || 'پرداخت بدهی',
      adjusted_by,
    });
  }

  /**
   * Settle customer account (set balance to zero)
   */
  async settleAccount(customer_id: string, adjusted_by: string): Promise<ICustomer> {
    return this.adjustBalance({
      customer_id,
      amount: 0,
      type: 'set',
      reason: 'تسویه حساب',
      adjusted_by,
    });
  }

  /**
   * Update credit limit
   */
  async updateCreditLimit(
    customer_id: string,
    credit_limit: number,
    updated_by: string
  ): Promise<ICustomer> {
    if (credit_limit < 0) {
      throw new ValidationError('سقف اعتبار نمی‌تواند منفی باشد');
    }

    const customer = await CustomerModel.findById(customer_id);
    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    // Check if current balance exceeds new credit limit
    if (customer.balance > credit_limit) {
      throw new ValidationError(
        'سقف اعتبار جدید کمتر از بدهی فعلی مشتری است'
      );
    }

    return CustomerModel.update(customer_id, { credit_limit });
  }

  /**
   * Get customers with debt
   */
  async getCustomersWithDebt(): Promise<ICustomer[]> {
    return CustomerModel.findWithDebt();
  }

  /**
   * Get customers with credit
   */
  async getCustomersWithCredit(): Promise<ICustomer[]> {
    return CustomerModel.findWithCredit();
  }

  /**
   * Check if customer can purchase (credit limit check)
   */
  async canPurchase(customer_id: string, amount: number): Promise<boolean> {
    const customer = await CustomerModel.findById(customer_id);
    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    if (customer.credit_limit === 0) {
      return true; // No credit limit set
    }

    const newBalance = customer.balance + amount;
    return newBalance <= customer.credit_limit!;
  }

  /**
   * Get available credit
   */
  async getAvailableCredit(customer_id: string): Promise<number> {
    const customer = await CustomerModel.findById(customer_id);
    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    if (customer.credit_limit === 0) {
      return Infinity; // No limit
    }

    return Math.max(0, customer.credit_limit! - customer.balance);
  }

  // ==========================================
  // SEARCH & FILTER
  // ==========================================

  /**
   * Search customers
   */
  async searchCustomers(searchTerm: string, limit: number = 10): Promise<ICustomer[]> {
    return CustomerModel.search(searchTerm, limit);
  }

  /**
   * Get customers by city
   */
  async getCustomersByCity(city: string): Promise<ICustomer[]> {
    return CustomerModel.findByCity(city);
  }

  /**
   * Advanced customer search
   */
  async advancedSearch(filters: {
    search?: string;
    city?: string;
    hasDebt?: boolean;
    hasCredit?: boolean;
    isActive?: boolean;
  }): Promise<ICustomer[]> {
    return CustomerModel.findAll(filters);
  }

  // ==========================================
  // CUSTOMER ACCOUNT & HISTORY
  // ==========================================

  /**
   * Get customer account summary
   */
  async getCustomerAccountSummary(customer_id: string): Promise<ICustomerAccountSummary> {
    const customer = await CustomerModel.findByIdWithStats(customer_id);
    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    const purchaseHistory = await CustomerModel.getPurchaseHistory(customer_id);

    // Determine balance status
    let balanceStatus: 'debtor' | 'creditor' | 'settled';
    if (customer.balance > 0) {
      balanceStatus = 'debtor';
    } else if (customer.balance < 0) {
      balanceStatus = 'creditor';
    } else {
      balanceStatus = 'settled';
    }

    // Calculate credit utilization
    let creditUtilization = 0;
    if (customer.credit_limit! > 0) {
      creditUtilization = (customer.balance / customer.credit_limit!) * 100;
    }

    return {
      customer,
      balance: customer.balance,
      balanceStatus,
      totalPurchases: customer.total_purchases,
      totalOrders: purchaseHistory.totalOrders,
      completedOrders: purchaseHistory.completedOrders,
      pendingOrders: purchaseHistory.pendingOrders,
      cancelledOrders: purchaseHistory.cancelledOrders,
      lastPurchaseDate: customer.last_purchase_date ?? null,
      creditUtilization,
    };
  }

  /**
   * Get customer purchase history
   */
  async getCustomerPurchaseHistory(customer_id: string) {
    const exists = await CustomerModel.exists(customer_id);
    if (!exists) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    return CustomerModel.getPurchaseHistory(customer_id);
  }

  /**
   * Get customer transaction history
   */
  async getCustomerTransactions(customer_id: string) {
    const exists = await CustomerModel.exists(customer_id);
    if (!exists) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    const TransactionModel = require('./Transaction').default;
    return TransactionModel.findByCustomer(customer_id);
  }

  // ==========================================
  // REPORTS & STATISTICS
  // ==========================================

  /**
   * Get customer statistics
   */
  async getCustomerStatistics(): Promise<ICustomerStats> {
    try {
      const stats = await CustomerModel.getStatistics();

      return {
        totalCustomers: stats.total,
        activeCustomers: stats.active,
        inactiveCustomers: stats.inactive,
        customersWithDebt: stats.withDebt,
        customersWithCredit: stats.withCredit,
        totalDebt: stats.totalDebt,
        totalCredit: stats.totalCredit,
        totalPurchases: stats.totalPurchases,
        averagePurchasePerCustomer:
          stats.active > 0 ? stats.totalPurchases / stats.active : 0,
        topCities: stats.topCities,
      };
    } catch (error) {
      logger.error('Error in getCustomerStatistics:', error);
      throw error;
    }
  }

  /**
   * Get top customers by purchases
   */
  async getTopCustomers(limit: number = 10): Promise<ITopCustomer[]> {
    const customers = await CustomerModel.getTopCustomers(limit);

    return customers.map((customer) => ({
      id: customer.id,
      customer_code: customer.customer_code,
      full_name: customer.full_name,
      phone: customer.phone,
      total_purchases: customer.total_purchases,
      total_orders: 0, // Would need to join with sales
      last_purchase_date: customer.last_purchase_date ?? null,
    }));
  }

  /**
   * Get debtor report
   */
  async getDebtorReport(): Promise<IDebtorReport[]> {
    const debtors = await CustomerModel.findWithDebt();

    return debtors.map((customer) => ({
      customer_id: customer.id,
      customer_code: customer.customer_code,
      full_name: customer.full_name,
      phone: customer.phone,
      debt_amount: customer.balance,
      credit_limit: customer.credit_limit ?? null,
      last_purchase_date: customer.last_purchase_date ?? null, // Added ?? null
    }));
  }

  /**
   * Get customers nearing credit limit
   */
  async getCustomersNearingCreditLimit(threshold: number = 80): Promise<ICustomer[]> {
    const customers = await CustomerModel.findAll({ isActive: true });

    return customers.filter((customer) => {
      if (customer.credit_limit === 0) return false;
      const utilization = (customer.balance / customer.credit_limit!) * 100;
      return utilization >= threshold;
    });
  }

  /**
   * Get customer lifetime value
   */
  async getCustomerLifetimeValue(customer_id: string): Promise<{
    customer_id: string;
    total_purchases: number;
    total_orders: number;
    average_order_value: number;
    customer_since: Date;
    days_active: number;
  }> {
    const customer = await CustomerModel.findById(customer_id);
    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    const purchaseHistory = await CustomerModel.getPurchaseHistory(customer_id);
    const daysActive = Math.floor(
      (Date.now() - customer.created_at.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      customer_id: customer.id,
      total_purchases: customer.total_purchases,
      total_orders: purchaseHistory.totalOrders,
      average_order_value:
        purchaseHistory.totalOrders > 0
          ? customer.total_purchases / purchaseHistory.totalOrders
          : 0,
      customer_since: customer.created_at,
      days_active: daysActive,
    };
  }

  /**
   * Get new customers (this month)
   */
  async getNewCustomers(): Promise<ICustomer[]> {
    const result = await query(
      `SELECT * FROM customers 
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      ORDER BY created_at DESC`
    );

    return result.rows as ICustomer[];
  }

  /**
   * Get inactive customers (no purchase in X days)
   */
  async getInactiveCustomers(days: number = 90): Promise<ICustomer[]> {
    const result = await query(
      `SELECT * FROM customers 
       WHERE is_active = true 
       AND (last_purchase_date IS NULL OR last_purchase_date < NOW() - INTERVAL '${days} days')
       ORDER BY last_purchase_date ASC NULLS FIRST`
    );

    return result.rows;
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  /**
   * Bulk activate/deactivate customers
   */
  async bulkSetActiveStatus(
    customer_ids: string[],
    is_active: boolean,
    updated_by: string
  ): Promise<number> {
    let updatedCount = 0;

    for (const id of customer_ids) {
      try {
        await CustomerModel.setActiveStatus(id, is_active);
        updatedCount++;
      } catch (error) {
        logger.error(`Error updating customer ${id}:`, error);
      }
    }

    logger.info(
      `Bulk ${is_active ? 'activated' : 'deactivated'} ${updatedCount} customers`
    );

    return updatedCount;
  }

  /**
   * Bulk update credit limit
   */
  async bulkUpdateCreditLimit(
    customer_ids: string[],
    credit_limit: number,
    updated_by: string
  ): Promise<number> {
    let updatedCount = 0;

    for (const id of customer_ids) {
      try {
        await this.updateCreditLimit(id, credit_limit, updated_by);
        updatedCount++;
      } catch (error) {
        logger.error(`Error updating credit limit for customer ${id}:`, error);
      }
    }

    logger.info(`Bulk updated credit limit for ${updatedCount} customers`);

    return updatedCount;
  }

  // ==========================================
  // VALIDATION
  // ==========================================

  /**
   * Validate customer data
   */
  validateCustomerData(data: Partial<ICreateCustomer>): void {
    if (data.phone && !validateMobileNumber(data.phone)) {
      throw new ValidationError('شماره تلفن نامعتبر است');
    }

    if (data.email && !validateEmail(data.email)) {
      throw new ValidationError('ایمیل نامعتبر است');
    }

    if (data.national_id && !validateNationalId(data.national_id)) {
      throw new ValidationError('کد ملی نامعتبر است');
    }

    if (data.credit_limit !== undefined && data.credit_limit < 0) {
      throw new ValidationError('سقف اعتبار نمی‌تواند منفی باشد');
    }

    if (data.postal_code && data.postal_code.length !== 10) {
      throw new ValidationError('کد پستی باید 10 رقم باشد');
    }
  }

  /**
   * Check if phone number is unique
   */
  async isPhoneUnique(phone: string, excludeId?: string): Promise<boolean> {
    try {
      const customer = await CustomerModel.findByPhone(phone);
      if (!customer) {
        return true;
      }
      if (excludeId && customer.id === excludeId) {
        return true;
      }
      return false;
    } catch (error) {
      return true; // Phone not found = unique
    }
  }

  /**
   * Check if email is unique
   */
  async isEmailUnique(email: string, excludeId?: string): Promise<boolean> {
    try {
      const customer = await CustomerModel.findByEmail(email);
      if (!customer) {
        return true;
      }
      if (excludeId && customer.id === excludeId) {
        return true;
      }
      return false;
    } catch (error) {
      return true; // Email not found = unique
    }
  }

  /**
   * Check if national ID is unique
   */
  async isNationalIdUnique(national_id: string, excludeId?: string): Promise<boolean> {
    try {
      const customer = await CustomerModel.findByNationalId(national_id);
      if (!customer) {
        return true;
      }
      if (excludeId && customer.id === excludeId) {
        return true;
      }
      return false;
    } catch (error) {
      return true; // National ID not found = unique
    }
  }

  // ==========================================
  // CUSTOMER INSIGHTS
  // ==========================================

  /**
   * Get customer segmentation
   */
  async getCustomerSegmentation(): Promise<{
    vip: number; // High value customers
    regular: number; // Regular customers
    inactive: number; // Inactive customers
    new: number; // New customers (this month)
  }> {
    const [vipResult, regularResult, inactiveResult, newResult] = await Promise.all([
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
         WHERE is_active = true 
         AND (last_purchase_date IS NULL OR last_purchase_date < NOW() - INTERVAL '90 days')`
      ),
      query(
        `SELECT COUNT(*) as count FROM customers 
         WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
      ),
    ]);

    return {
      vip: parseInt(vipResult.rows[0]?.count || '0', 10),
      regular: parseInt(regularResult.rows[0]?.count || '0', 10),
      inactive: parseInt(inactiveResult.rows[0]?.count || '0', 10),
      new: parseInt(newResult.rows[0]?.count || '0', 10),
    };
  }

  /**
   * Get customer retention rate
   */
  async getCustomerRetentionRate(months: number = 3): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    retentionRate: number;
  }> {
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

    return {
      totalCustomers: total,
      activeCustomers: active,
      retentionRate: total > 0 ? (active / total) * 100 : 0,
    };
  }
}

// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================

export default new CustomerService();