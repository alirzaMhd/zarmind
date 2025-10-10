// ==========================================
// ZARMIND - Transaction Model
// ==========================================

import {
  query,
  transaction as dbTransaction,
  buildInsertQuery,
  buildUpdateQuery,
  PoolClient,
} from '../config/database';
import {
  ITransaction,
  TransactionType,
  PaymentMethod,
  IQueryResult,
} from '../types';
import { NotFoundError, ConflictError, ValidationError } from '../types';
import logger from '../utils/logger';
import { generateUniqueCode } from '../utils/helpers';
import CustomerModel from './Customer';
import SaleModel from './Sale';

// ==========================================
// INTERFACES
// ==========================================

export interface ICreateTransaction {
  customer_id?: string;
  sale_id?: string;
  type: TransactionType;
  amount: number;
  payment_method?: PaymentMethod;
  reference_number?: string;
  description?: string;
  transaction_date?: Date;
  created_by: string;
}

export interface ITransactionFilter {
  customer_id?: string;
  sale_id?: string;
  type?: TransactionType;
  payment_method?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface ITransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  byType: Record<TransactionType, { count: number; amount: number }>;
  byPaymentMethod: Record<PaymentMethod, { count: number; amount: number }>;
}

export interface ICashFlow {
  income: number;
  expense: number;
  netCashFlow: number;
}

// ==========================================
// TRANSACTION MODEL
// ==========================================

class TransactionModel {
  private tableName = 'transactions';

  // ==========================================
  // CREATE
  // ==========================================

  /**
   * Create a new transaction
   */
  async create(transactionData: ICreateTransaction): Promise<ITransaction> {
    return dbTransaction(async (client: PoolClient) => {
      try {
        // Generate unique transaction number
        const transaction_number = await this.generateTransactionNumber();

        // Validate transaction
        await this.validateTransaction(transactionData);

        // Prepare transaction data
        const transactionToInsert = {
          transaction_number,
          customer_id: transactionData.customer_id || null,
          sale_id: transactionData.sale_id || null,
          type: transactionData.type,
          amount: transactionData.amount,
          payment_method: transactionData.payment_method || PaymentMethod.CASH,
          reference_number: transactionData.reference_number || null,
          description: transactionData.description || null,
          transaction_date: transactionData.transaction_date || new Date(),
          created_by: transactionData.created_by,
        };

        // Insert transaction
        const result = await client.query<ITransaction>(
          `INSERT INTO ${this.tableName} 
          (transaction_number, customer_id, sale_id, type, amount, payment_method, 
           reference_number, description, transaction_date, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [
            transactionToInsert.transaction_number,
            transactionToInsert.customer_id,
            transactionToInsert.sale_id,
            transactionToInsert.type,
            transactionToInsert.amount,
            transactionToInsert.payment_method,
            transactionToInsert.reference_number,
            transactionToInsert.description,
            transactionToInsert.transaction_date,
            transactionToInsert.created_by,
          ]
        );

        const createdTransaction = result.rows[0];

        logger.info(
          `Transaction created: ${createdTransaction.transaction_number} - ${createdTransaction.type} - ${createdTransaction.amount}`
        );

        return createdTransaction;
      } catch (error) {
        logger.error('Error creating transaction:', error);
        throw error;
      }
    });
  }

  /**
   * Create sale transaction
   */
  async createSaleTransaction(
    sale_id: string,
    customer_id: string | null,
    amount: number,
    payment_method: PaymentMethod,
    created_by: string,
    reference_number?: string
  ): Promise<ITransaction> {
    return this.create({
      customer_id,
      sale_id,
      type: TransactionType.SALE,
      amount,
      payment_method,
      reference_number,
      description: 'تراکنش فروش',
      created_by,
    });
  }

  /**
   * Create payment transaction
   */
  async createPaymentTransaction(
    customer_id: string,
    amount: number,
    payment_method: PaymentMethod,
    created_by: string,
    sale_id?: string,
    reference_number?: string,
    description?: string
  ): Promise<ITransaction> {
    return this.create({
      customer_id,
      sale_id,
      type: TransactionType.PAYMENT,
      amount,
      payment_method,
      reference_number,
      description: description || 'پرداخت مشتری',
      created_by,
    });
  }

  /**
   * Create expense transaction
   */
  async createExpenseTransaction(
    amount: number,
    description: string,
    payment_method: PaymentMethod,
    created_by: string,
    reference_number?: string
  ): Promise<ITransaction> {
    return this.create({
      type: TransactionType.EXPENSE,
      amount,
      payment_method,
      reference_number,
      description,
      created_by,
    });
  }

  /**
   * Create return transaction
   */
  async createReturnTransaction(
    sale_id: string,
    customer_id: string | null,
    amount: number,
    payment_method: PaymentMethod,
    created_by: string,
    description?: string
  ): Promise<ITransaction> {
    return this.create({
      customer_id,
      sale_id,
      type: TransactionType.RETURN,
      amount,
      payment_method,
      description: description || 'برگشت کالا',
      created_by,
    });
  }

  // ==========================================
  // READ
  // ==========================================

  /**
   * Find transaction by ID
   */
  async findById(id: string): Promise<ITransaction | null> {
    const result = await query<ITransaction>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find transaction by transaction number
   */
  async findByTransactionNumber(transaction_number: string): Promise<ITransaction | null> {
    const result = await query<ITransaction>(
      `SELECT * FROM ${this.tableName} WHERE transaction_number = $1`,
      [transaction_number]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all transactions with optional filters
   */
  async findAll(filters?: ITransactionFilter): Promise<ITransaction[]> {
    let sql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters?.customer_id) {
      sql += ` AND customer_id = $${paramIndex}`;
      params.push(filters.customer_id);
      paramIndex++;
    }

    if (filters?.sale_id) {
      sql += ` AND sale_id = $${paramIndex}`;
      params.push(filters.sale_id);
      paramIndex++;
    }

    if (filters?.type) {
      sql += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters?.payment_method) {
      sql += ` AND payment_method = $${paramIndex}`;
      params.push(filters.payment_method);
      paramIndex++;
    }

    if (filters?.startDate) {
      sql += ` AND transaction_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      sql += ` AND transaction_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters?.minAmount !== undefined) {
      sql += ` AND amount >= $${paramIndex}`;
      params.push(filters.minAmount);
      paramIndex++;
    }

    if (filters?.maxAmount !== undefined) {
      sql += ` AND amount <= $${paramIndex}`;
      params.push(filters.maxAmount);
      paramIndex++;
    }

    if (filters?.search) {
      sql += ` AND (
        transaction_number ILIKE $${paramIndex} OR 
        reference_number ILIKE $${paramIndex} OR 
        description ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY transaction_date DESC, created_at DESC`;

    const result = await query<ITransaction>(sql, params);
    return result.rows;
  }

  /**
   * Get transactions with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 20,
    filters?: ITransactionFilter
  ): Promise<{ transactions: ITransaction[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;

    let countSql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE 1=1`;
    let dataSql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters (same as findAll)
    if (filters?.customer_id) {
      const filter = ` AND customer_id = $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.customer_id);
      paramIndex++;
    }

    if (filters?.sale_id) {
      const filter = ` AND sale_id = $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.sale_id);
      paramIndex++;
    }

    if (filters?.type) {
      const filter = ` AND type = $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters?.payment_method) {
      const filter = ` AND payment_method = $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.payment_method);
      paramIndex++;
    }

    if (filters?.startDate) {
      const filter = ` AND transaction_date >= $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      const filter = ` AND transaction_date <= $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters?.minAmount !== undefined) {
      const filter = ` AND amount >= $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.minAmount);
      paramIndex++;
    }

    if (filters?.maxAmount !== undefined) {
      const filter = ` AND amount <= $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.maxAmount);
      paramIndex++;
    }

    if (filters?.search) {
      const filter = ` AND (
        transaction_number ILIKE $${paramIndex} OR 
        reference_number ILIKE $${paramIndex} OR 
        description ILIKE $${paramIndex}
      )`;
      countSql += filter;
      dataSql += filter;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    dataSql += ` ORDER BY transaction_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataParams = [...params, limit, offset];

    // Execute queries
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(countSql, params),
      query<ITransaction>(dataSql, dataParams),
    ]);

    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    return {
      transactions: dataResult.rows,
      total,
      page,
      limit,
    };
  }

  /**
   * Get transactions by customer
   */
  async findByCustomer(customer_id: string): Promise<ITransaction[]> {
    const result = await query<ITransaction>(
      `SELECT * FROM ${this.tableName} 
       WHERE customer_id = $1 
       ORDER BY transaction_date DESC`,
      [customer_id]
    );

    return result.rows;
  }

  /**
   * Get transactions by sale
   */
  async findBySale(sale_id: string): Promise<ITransaction[]> {
    const result = await query<ITransaction>(
      `SELECT * FROM ${this.tableName} 
       WHERE sale_id = $1 
       ORDER BY transaction_date DESC`,
      [sale_id]
    );

    return result.rows;
  }

  /**
   * Get transactions by type
   */
  async findByType(type: TransactionType): Promise<ITransaction[]> {
    const result = await query<ITransaction>(
      `SELECT * FROM ${this.tableName} 
       WHERE type = $1 
       ORDER BY transaction_date DESC`,
      [type]
    );

    return result.rows;
  }

  /**
   * Get transactions by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<ITransaction[]> {
    const result = await query<ITransaction>(
      `SELECT * FROM ${this.tableName} 
       WHERE transaction_date BETWEEN $1 AND $2 
       ORDER BY transaction_date DESC`,
      [startDate, endDate]
    );

    return result.rows;
  }

  /**
   * Get recent transactions
   */
  async findRecent(limit: number = 10): Promise<ITransaction[]> {
    const result = await query<ITransaction>(
      `SELECT * FROM ${this.tableName} 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Get today's transactions
   */
  async getTodayTransactions(): Promise<ITransaction[]> {
    const result = await query<ITransaction>(
      `SELECT * FROM ${this.tableName} 
       WHERE DATE(transaction_date) = CURRENT_DATE 
       ORDER BY transaction_date DESC`
    );

    return result.rows;
  }

  // ==========================================
  // DELETE
  // ==========================================

  /**
   * Delete transaction by ID (only if not critical)
   */
  async hardDelete(id: string): Promise<void> {
    const transaction = await this.findById(id);
    if (!transaction) {
      throw new NotFoundError('تراکنش یافت نشد');
    }

    // Prevent deleting sale transactions
    if (transaction.type === TransactionType.SALE) {
      throw new ValidationError('نمی‌توان تراکنش فروش را حذف کرد');
    }

    await query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);

    logger.warn(`Transaction permanently deleted: ${transaction.transaction_number}`);
  }

  // ==========================================
  // STATISTICS & REPORTS
  // ==========================================

  /**
   * Get transaction summary
   */
  async getSummary(filters?: ITransactionFilter): Promise<ITransactionSummary> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // Build where clause from filters
    if (filters?.customer_id) {
      whereClause += ` AND customer_id = $${paramIndex}`;
      params.push(filters.customer_id);
      paramIndex++;
    }

    if (filters?.type) {
      whereClause += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters?.startDate) {
      whereClause += ` AND transaction_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      whereClause += ` AND transaction_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    const [totalResult, byTypeResult, byPaymentResult] = await Promise.all([
      query<{ count: string; total_amount: string }>(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount 
         FROM ${this.tableName} ${whereClause}`,
        params
      ),
      query<{ type: TransactionType; count: string; total_amount: string }>(
        `SELECT type, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount 
         FROM ${this.tableName} ${whereClause}
         GROUP BY type`,
        params
      ),
      query<{ payment_method: PaymentMethod; count: string; total_amount: string }>(
        `SELECT payment_method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount 
         FROM ${this.tableName} ${whereClause}
         GROUP BY payment_method`,
        params
      ),
    ]);

    const totalTransactions = parseInt(totalResult.rows[0]?.count || '0', 10);
    const totalAmount = parseFloat(totalResult.rows[0]?.total_amount || '0');

    const byType: Record<TransactionType, { count: number; amount: number }> = {
      sale: { count: 0, amount: 0 },
      purchase: { count: 0, amount: 0 },
      return: { count: 0, amount: 0 },
      payment: { count: 0, amount: 0 },
      expense: { count: 0, amount: 0 },
      adjustment: { count: 0, amount: 0 },
    };

    byTypeResult.rows.forEach((row) => {
      byType[row.type] = {
        count: parseInt(row.count, 10),
        amount: parseFloat(row.total_amount),
      };
    });

    const byPaymentMethod: Record<PaymentMethod, { count: number; amount: number }> = {
      cash: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
      transfer: { count: 0, amount: 0 },
      check: { count: 0, amount: 0 },
      mixed: { count: 0, amount: 0 },
    };

    byPaymentResult.rows.forEach((row) => {
      byPaymentMethod[row.payment_method] = {
        count: parseInt(row.count, 10),
        amount: parseFloat(row.total_amount),
      };
    });

    return {
      totalTransactions,
      totalAmount,
      byType,
      byPaymentMethod,
    };
  }

  /**
   * Get cash flow (income vs expense)
   */
  async getCashFlow(startDate?: Date, endDate?: Date): Promise<ICashFlow> {
    let whereClause = '';
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause = 'WHERE transaction_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const result = await query<{ income: string; expense: string }>(
      `SELECT 
        COALESCE(SUM(CASE 
          WHEN type IN ('sale', 'payment') THEN amount 
          ELSE 0 
        END), 0) as income,
        COALESCE(SUM(CASE 
          WHEN type IN ('purchase', 'expense', 'return') THEN amount 
          ELSE 0 
        END), 0) as expense
       FROM ${this.tableName} ${whereClause}`,
      params
    );

    const income = parseFloat(result.rows[0]?.income || '0');
    const expense = parseFloat(result.rows[0]?.expense || '0');

    return {
      income,
      expense,
      netCashFlow: income - expense,
    };
  }

  /**
   * Get today's cash flow
   */
  async getTodayCashFlow(): Promise<ICashFlow> {
    const result = await query<{ income: string; expense: string }>(
      `SELECT 
        COALESCE(SUM(CASE 
          WHEN type IN ('sale', 'payment') THEN amount 
          ELSE 0 
        END), 0) as income,
        COALESCE(SUM(CASE 
          WHEN type IN ('purchase', 'expense', 'return') THEN amount 
          ELSE 0 
        END), 0) as expense
       FROM ${this.tableName} 
       WHERE DATE(transaction_date) = CURRENT_DATE`
    );

    const income = parseFloat(result.rows[0]?.income || '0');
    const expense = parseFloat(result.rows[0]?.expense || '0');

    return {
      income,
      expense,
      netCashFlow: income - expense,
    };
  }

  /**
   * Get total by payment method
   */
  async getTotalByPaymentMethod(
    payment_method: PaymentMethod,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    let sql = `SELECT COALESCE(SUM(amount), 0) as total 
               FROM ${this.tableName} 
               WHERE payment_method = $1`;
    const params: any[] = [payment_method];

    if (startDate && endDate) {
      sql += ' AND transaction_date BETWEEN $2 AND $3';
      params.push(startDate, endDate);
    }

    const result = await query<{ total: string }>(sql, params);

    return parseFloat(result.rows[0]?.total || '0');
  }

  /**
   * Get customer transaction summary
   */
  async getCustomerTransactionSummary(customer_id: string): Promise<{
    totalTransactions: number;
    totalPaid: number;
    totalSales: number;
    totalReturns: number;
    netAmount: number;
  }> {
    const result = await query<{
      total_transactions: string;
      total_paid: string;
      total_sales: string;
      total_returns: string;
    }>(
      `SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END), 0) as total_sales,
        COALESCE(SUM(CASE WHEN type = 'return' THEN amount ELSE 0 END), 0) as total_returns
       FROM ${this.tableName} 
       WHERE customer_id = $1`,
      [customer_id]
    );

    const row = result.rows[0];
    const totalSales = parseFloat(row?.total_sales || '0');
    const totalPaid = parseFloat(row?.total_paid || '0');
    const totalReturns = parseFloat(row?.total_returns || '0');

    return {
      totalTransactions: parseInt(row?.total_transactions || '0', 10),
      totalPaid,
      totalSales,
      totalReturns,
      netAmount: totalSales - totalPaid - totalReturns,
    };
  }

  // ==========================================
  // VALIDATION
  // ==========================================

  /**
   * Validate transaction data
   */
  private async validateTransaction(transactionData: ICreateTransaction): Promise<void> {
    // Validate amount
    if (transactionData.amount <= 0) {
      throw new ValidationError('مبلغ تراکنش باید مثبت باشد');
    }

    // Validate customer exists if provided
    if (transactionData.customer_id) {
      const customerExists = await CustomerModel.exists(transactionData.customer_id);
      if (!customerExists) {
        throw new NotFoundError('مشتری یافت نشد');
      }
    }

    // Validate sale exists if provided
    if (transactionData.sale_id) {
      const saleExists = await SaleModel.exists(transactionData.sale_id);
      if (!saleExists) {
        throw new NotFoundError('فروش یافت نشد');
      }
    }

    // Type-specific validations
    if (transactionData.type === TransactionType.SALE && !transactionData.sale_id) {
      throw new ValidationError('برای تراکنش فروش باید شناسه فروش مشخص شود');
    }

    if (transactionData.type === TransactionType.PAYMENT && !transactionData.customer_id) {
      throw new ValidationError('برای تراکنش پرداخت باید مشتری مشخص شود');
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if transaction exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`,
      [id]
    );

    return result.rows[0]?.exists || false;
  }

  /**
   * Generate unique transaction number
   */
  async generateTransactionNumber(): Promise<string> {
    const prefix = 'TXN';
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Get count for today
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} 
       WHERE DATE(created_at) = CURRENT_DATE`
    );

    const count = parseInt(countResult.rows[0]?.count || '0', 10) + 1;
    const sequence = String(count).padStart(4, '0');

    return `${prefix}-${year}${month}${day}-${sequence}`;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    total: number;
    totalAmount: number;
    todayCount: number;
    todayAmount: number;
    byType: Record<TransactionType, number>;
    byPaymentMethod: Record<PaymentMethod, number>;
  }> {
    const [totalResult, todayResult, byTypeResult, byPaymentResult] = await Promise.all([
      query<{ count: string; total_amount: string }>(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount 
         FROM ${this.tableName}`
      ),
      query<{ count: string; total_amount: string }>(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount 
         FROM ${this.tableName} 
         WHERE DATE(transaction_date) = CURRENT_DATE`
      ),
      query<{ type: TransactionType; count: string }>(
        `SELECT type, COUNT(*) as count 
         FROM ${this.tableName} 
         GROUP BY type`
      ),
      query<{ payment_method: PaymentMethod; count: string }>(
        `SELECT payment_method, COUNT(*) as count 
         FROM ${this.tableName} 
         GROUP BY payment_method`
      ),
    ]);

    const byType: Record<TransactionType, number> = {
      sale: 0,
      purchase: 0,
      return: 0,
      payment: 0,
      expense: 0,
      adjustment: 0,
    };

    byTypeResult.rows.forEach((row) => {
      byType[row.type] = parseInt(row.count, 10);
    });

    const byPaymentMethod: Record<PaymentMethod, number> = {
      cash: 0,
      card: 0,
      transfer: 0,
      check: 0,
      mixed: 0,
    };

    byPaymentResult.rows.forEach((row) => {
      byPaymentMethod[row.payment_method] = parseInt(row.count, 10);
    });

    return {
      total: parseInt(totalResult.rows[0]?.count || '0', 10),
      totalAmount: parseFloat(totalResult.rows[0]?.total_amount || '0'),
      todayCount: parseInt(todayResult.rows[0]?.count || '0', 10),
      todayAmount: parseFloat(todayResult.rows[0]?.total_amount || '0'),
      byType,
      byPaymentMethod,
    };
  }
}

// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================

export default new TransactionModel();