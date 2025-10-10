// ==========================================
// ZARMIND - Sale Model
// ==========================================

import {
  query,
  transaction,
  buildInsertQuery,
  buildUpdateQuery,
  PoolClient,
} from '../config/database';
import {
  ISale,
  ISaleItem,
  SaleType,
  PaymentMethod,
  SaleStatus,
  IQueryResult,
} from '../types';
import { NotFoundError, ConflictError, ValidationError } from '../types';
import logger from '../utils/logger';
import { generateUniqueCode } from '../utils/helpers';
import ProductModel from './Product';
import CustomerModel from './Customer';

// ==========================================
// INTERFACES
// ==========================================

export interface ICreateSale {
  customer_id?: string;
  sale_type?: SaleType;
  payment_method?: PaymentMethod;
  gold_price: number;
  discount?: number;
  tax?: number;
  paid_amount?: number;
  status?: SaleStatus;
  sale_date?: Date;
  notes?: string;
  items: ICreateSaleItem[];
  created_by: string;
}

export interface ICreateSaleItem {
  product_id: string;
  quantity: number;
}

export interface IUpdateSale {
  customer_id?: string;
  sale_type?: SaleType;
  payment_method?: PaymentMethod;
  discount?: number;
  tax?: number;
  paid_amount?: number;
  status?: SaleStatus;
  notes?: string;
}

export interface ISaleWithItems extends ISale {
  items: ISaleItem[];
}

export interface ISaleFilter {
  customer_id?: string;
  status?: SaleStatus;
  sale_type?: SaleType;
  payment_method?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface IPaymentUpdate {
  sale_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  payment_date?: Date;
  created_by: string;
}

// ==========================================
// SALE MODEL
// ==========================================

class SaleModel {
  private tableName = 'sales';
  private itemsTableName = 'sale_items';

  // ==========================================
  // CREATE
  // ==========================================

  /**
   * Create a new sale with items (within transaction)
   */
  async create(saleData: ICreateSale): Promise<ISaleWithItems> {
    return transaction(async (client: PoolClient) => {
      try {
        // Generate unique sale number
        const sale_number = await this.generateSaleNumber();

        // Validate items
        if (!saleData.items || saleData.items.length === 0) {
          throw new ValidationError('حداقل یک محصول باید انتخاب شود');
        }

        // Calculate totals
        const { totalAmount, items } = await this.calculateSaleTotals(
          saleData.items,
          saleData.gold_price
        );

        const discount = saleData.discount || 0;
        const tax = saleData.tax || 0;
        const finalAmount = totalAmount - discount + tax;
        const paidAmount = saleData.paid_amount || 0;
        const remainingAmount = finalAmount - paidAmount;

        // Validate payment
        if (paidAmount > finalAmount) {
          throw new ValidationError('مبلغ پرداختی نمی‌تواند بیشتر از مبلغ کل باشد');
        }

        // Determine status
        let status = saleData.status;
        if (!status) {
          if (paidAmount === 0) {
            status = SaleStatus.DRAFT;
          } else if (remainingAmount > 0) {
            status = SaleStatus.PARTIAL;
          } else {
            status = SaleStatus.COMPLETED;
          }
        }

        // Validate customer credit limit if has remaining amount
        if (saleData.customer_id && remainingAmount > 0) {
          const customer = await CustomerModel.findById(saleData.customer_id);
          if (customer && customer.credit_limit > 0) {
            const newBalance = customer.balance + remainingAmount;
            if (newBalance > customer.credit_limit) {
              throw new ValidationError(
                'مبلغ باقیمانده از سقف اعتبار مشتری بیشتر است'
              );
            }
          }
        }

        // Prepare sale data
        const saleToInsert = {
          sale_number,
          customer_id: saleData.customer_id || null,
          sale_type: saleData.sale_type || SaleType.CASH,
          payment_method: saleData.payment_method || PaymentMethod.CASH,
          total_amount: totalAmount,
          gold_price: saleData.gold_price,
          discount,
          tax,
          final_amount: finalAmount,
          paid_amount: paidAmount,
          remaining_amount: remainingAmount,
          status,
          sale_date: saleData.sale_date || new Date(),
          notes: saleData.notes || null,
          created_by: saleData.created_by,
        };

        // Insert sale
        const saleResult = await client.query<ISale>(
          `INSERT INTO ${this.tableName} 
          (sale_number, customer_id, sale_type, payment_method, total_amount, 
           gold_price, discount, tax, final_amount, paid_amount, remaining_amount, 
           status, sale_date, notes, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING *`,
          [
            saleToInsert.sale_number,
            saleToInsert.customer_id,
            saleToInsert.sale_type,
            saleToInsert.payment_method,
            saleToInsert.total_amount,
            saleToInsert.gold_price,
            saleToInsert.discount,
            saleToInsert.tax,
            saleToInsert.final_amount,
            saleToInsert.paid_amount,
            saleToInsert.remaining_amount,
            saleToInsert.status,
            saleToInsert.sale_date,
            saleToInsert.notes,
            saleToInsert.created_by,
          ]
        );

        const sale = saleResult.rows[0];

        // Insert sale items and update product stock
        const saleItems: ISaleItem[] = [];
        for (const item of items) {
          const itemResult = await client.query<ISaleItem>(
            `INSERT INTO ${this.itemsTableName} 
            (sale_id, product_id, product_name, quantity, weight, carat, 
             unit_price, wage, total_price)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
              sale.id,
              item.product_id,
              item.product_name,
              item.quantity,
              item.weight,
              item.carat,
              item.unit_price,
              item.wage,
              item.total_price,
            ]
          );

          saleItems.push(itemResult.rows[0]);

          // Update product stock (decrease)
          await client.query(
            `UPDATE products 
             SET stock_quantity = stock_quantity - $1 
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }

        // Update customer balance and total purchases if customer exists
        if (sale.customer_id && status !== SaleStatus.CANCELLED) {
          await client.query(
            `UPDATE customers 
             SET balance = balance + $1,
                 total_purchases = total_purchases + $2,
                 last_purchase_date = $3
             WHERE id = $4`,
            [remainingAmount, finalAmount, sale.sale_date, sale.customer_id]
          );
        }

        logger.info(`Sale created: ${sale.sale_number} - Amount: ${finalAmount}`);

        return {
          ...sale,
          items: saleItems,
        };
      } catch (error) {
        logger.error('Error creating sale:', error);
        throw error;
      }
    });
  }

  // ==========================================
  // READ
  // ==========================================

  /**
   * Find sale by ID
   */
  async findById(id: string): Promise<ISale | null> {
    const result = await query<ISale>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find sale by sale number
   */
  async findBySaleNumber(sale_number: string): Promise<ISale | null> {
    const result = await query<ISale>(
      `SELECT * FROM ${this.tableName} WHERE sale_number = $1`,
      [sale_number]
    );

    return result.rows[0] || null;
  }

  /**
   * Find sale with items
   */
  async findByIdWithItems(id: string): Promise<ISaleWithItems | null> {
    const sale = await this.findById(id);
    if (!sale) {
      return null;
    }

    const items = await this.getSaleItems(id);

    return {
      ...sale,
      items,
    };
  }

  /**
   * Get sale items
   */
  async getSaleItems(sale_id: string): Promise<ISaleItem[]> {
    const result = await query<ISaleItem>(
      `SELECT * FROM ${this.itemsTableName} WHERE sale_id = $1 ORDER BY created_at ASC`,
      [sale_id]
    );

    return result.rows;
  }

  /**
   * Get all sales with optional filters
   */
  async findAll(filters?: ISaleFilter): Promise<ISale[]> {
    let sql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters?.customer_id) {
      sql += ` AND customer_id = $${paramIndex}`;
      params.push(filters.customer_id);
      paramIndex++;
    }

    if (filters?.status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.sale_type) {
      sql += ` AND sale_type = $${paramIndex}`;
      params.push(filters.sale_type);
      paramIndex++;
    }

    if (filters?.payment_method) {
      sql += ` AND payment_method = $${paramIndex}`;
      params.push(filters.payment_method);
      paramIndex++;
    }

    if (filters?.startDate) {
      sql += ` AND sale_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      sql += ` AND sale_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters?.search) {
      sql += ` AND (
        sale_number ILIKE $${paramIndex} OR 
        notes ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY sale_date DESC, created_at DESC`;

    const result = await query<ISale>(sql, params);
    return result.rows;
  }

  /**
   * Get sales with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 20,
    filters?: ISaleFilter
  ): Promise<{ sales: ISale[]; total: number; page: number; limit: number }> {
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

    if (filters?.status) {
      const filter = ` AND status = $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.sale_type) {
      const filter = ` AND sale_type = $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.sale_type);
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
      const filter = ` AND sale_date >= $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      const filter = ` AND sale_date <= $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters?.search) {
      const filter = ` AND (
        sale_number ILIKE $${paramIndex} OR 
        notes ILIKE $${paramIndex}
      )`;
      countSql += filter;
      dataSql += filter;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    dataSql += ` ORDER BY sale_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataParams = [...params, limit, offset];

    // Execute queries
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(countSql, params),
      query<ISale>(dataSql, dataParams),
    ]);

    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    return {
      sales: dataResult.rows,
      total,
      page,
      limit,
    };
  }

  /**
   * Get sales by customer
   */
  async findByCustomer(customer_id: string): Promise<ISale[]> {
    const result = await query<ISale>(
      `SELECT * FROM ${this.tableName} 
       WHERE customer_id = $1 
       ORDER BY sale_date DESC`,
      [customer_id]
    );

    return result.rows;
  }

  /**
   * Get recent sales
   */
  async findRecent(limit: number = 10): Promise<ISale[]> {
    const result = await query<ISale>(
      `SELECT * FROM ${this.tableName} 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Get pending sales (drafts and partial payments)
   */
  async findPending(): Promise<ISale[]> {
    const result = await query<ISale>(
      `SELECT * FROM ${this.tableName} 
       WHERE status IN ('draft', 'partial') 
       ORDER BY sale_date DESC`
    );

    return result.rows;
  }

  /**
   * Get sales by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<ISale[]> {
    const result = await query<ISale>(
      `SELECT * FROM ${this.tableName} 
       WHERE sale_date BETWEEN $1 AND $2 
       ORDER BY sale_date DESC`,
      [startDate, endDate]
    );

    return result.rows;
  }

  // ==========================================
  // UPDATE
  // ==========================================

  /**
   * Update sale by ID
   */
  async update(id: string, updateData: IUpdateSale): Promise<ISale> {
    return transaction(async (client: PoolClient) => {
      const sale = await this.findById(id);
      if (!sale) {
        throw new NotFoundError('فروش یافت نشد');
      }

      // Build update query
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      let newPaidAmount = sale.paid_amount;
      let recalculate = false;

      if (updateData.customer_id !== undefined) {
        fields.push(`customer_id = $${paramIndex}`);
        values.push(updateData.customer_id);
        paramIndex++;
      }

      if (updateData.sale_type !== undefined) {
        fields.push(`sale_type = $${paramIndex}`);
        values.push(updateData.sale_type);
        paramIndex++;
      }

      if (updateData.payment_method !== undefined) {
        fields.push(`payment_method = $${paramIndex}`);
        values.push(updateData.payment_method);
        paramIndex++;
      }

      if (updateData.discount !== undefined) {
        fields.push(`discount = $${paramIndex}`);
        values.push(updateData.discount);
        paramIndex++;
        recalculate = true;
      }

      if (updateData.tax !== undefined) {
        fields.push(`tax = $${paramIndex}`);
        values.push(updateData.tax);
        paramIndex++;
        recalculate = true;
      }

      if (updateData.paid_amount !== undefined) {
        newPaidAmount = updateData.paid_amount;
        fields.push(`paid_amount = $${paramIndex}`);
        values.push(updateData.paid_amount);
        paramIndex++;
        recalculate = true;
      }

      if (updateData.status !== undefined) {
        fields.push(`status = $${paramIndex}`);
        values.push(updateData.status);
        paramIndex++;
      }

      if (updateData.notes !== undefined) {
        fields.push(`notes = $${paramIndex}`);
        values.push(updateData.notes);
        paramIndex++;
      }

      if (fields.length === 0) {
        return sale; // No changes
      }

      // Recalculate final and remaining amounts if needed
      if (recalculate) {
        const discount = updateData.discount !== undefined ? updateData.discount : sale.discount;
        const tax = updateData.tax !== undefined ? updateData.tax : sale.tax;
        const finalAmount = sale.total_amount - discount + tax;
        const remainingAmount = finalAmount - newPaidAmount;

        fields.push(`final_amount = $${paramIndex}`);
        values.push(finalAmount);
        paramIndex++;

        fields.push(`remaining_amount = $${paramIndex}`);
        values.push(remainingAmount);
        paramIndex++;

        // Update customer balance if changed
        if (sale.customer_id) {
          const balanceDiff = remainingAmount - sale.remaining_amount;
          if (balanceDiff !== 0) {
            await client.query(
              `UPDATE customers 
               SET balance = balance + $1 
               WHERE id = $2`,
              [balanceDiff, sale.customer_id]
            );
          }
        }
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const sql = `
        UPDATE ${this.tableName} 
        SET ${fields.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query<ISale>(sql, values);
      const updatedSale = result.rows[0];

      logger.info(`Sale updated: ${updatedSale.sale_number}`);

      return updatedSale;
    });
  }

  /**
   * Update sale status
   */
  async updateStatus(id: string, status: SaleStatus): Promise<ISale> {
    const result = await query<ISale>(
      `UPDATE ${this.tableName} 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('فروش یافت نشد');
    }

    logger.info(`Sale status updated: ${result.rows[0].sale_number} - ${status}`);

    return result.rows[0];
  }

  /**
   * Add payment to sale
   */
  async addPayment(paymentData: IPaymentUpdate): Promise<ISale> {
    return transaction(async (client: PoolClient) => {
      const { sale_id, amount, payment_method, reference_number, payment_date, created_by } =
        paymentData;

      const sale = await this.findById(sale_id);
      if (!sale) {
        throw new NotFoundError('فروش یافت نشد');
      }

      if (amount <= 0) {
        throw new ValidationError('مبلغ پرداخت باید مثبت باشد');
      }

      if (amount > sale.remaining_amount) {
        throw new ValidationError('مبلغ پرداخت بیشتر از مانده است');
      }

      const newPaidAmount = sale.paid_amount + amount;
      const newRemainingAmount = sale.remaining_amount - amount;
      const newStatus =
        newRemainingAmount === 0 ? SaleStatus.COMPLETED : SaleStatus.PARTIAL;

      // Update sale
      const saleResult = await client.query<ISale>(
        `UPDATE ${this.tableName} 
         SET paid_amount = $1, 
             remaining_amount = $2, 
             status = $3,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $4
         RETURNING *`,
        [newPaidAmount, newRemainingAmount, newStatus, sale_id]
      );

      // Create transaction record
      await client.query(
        `INSERT INTO transactions 
         (transaction_number, customer_id, sale_id, type, amount, payment_method, 
          reference_number, description, transaction_date, created_by)
         VALUES ($1, $2, $3, 'payment', $4, $5, $6, $7, $8, $9)`,
        [
          `TXN-${Date.now()}`,
          sale.customer_id,
          sale_id,
          amount,
          payment_method,
          reference_number,
          `پرداخت بابت فاکتور ${sale.sale_number}`,
          payment_date || new Date(),
          created_by,
        ]
      );

      // Update customer balance
      if (sale.customer_id) {
        await client.query(
          `UPDATE customers 
           SET balance = balance - $1 
           WHERE id = $2`,
          [amount, sale.customer_id]
        );
      }

      logger.info(`Payment added to sale ${sale.sale_number}: ${amount}`);

      return saleResult.rows[0];
    });
  }

  // ==========================================
  // DELETE / CANCEL
  // ==========================================

  /**
   * Cancel sale (reverse stock and customer balance)
   */
  async cancel(id: string, cancelled_by: string): Promise<ISale> {
    return transaction(async (client: PoolClient) => {
      const sale = await this.findById(id);
      if (!sale) {
        throw new NotFoundError('فروش یافت نشد');
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new ValidationError('فروش قبلاً لغو شده است');
      }

      // Get sale items
      const items = await this.getSaleItems(id);

      // Restore product stock
      for (const item of items) {
        await client.query(
          `UPDATE products 
           SET stock_quantity = stock_quantity + $1 
           WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }

      // Update customer balance
      if (sale.customer_id) {
        await client.query(
          `UPDATE customers 
           SET balance = balance - $1,
               total_purchases = total_purchases - $2
           WHERE id = $3`,
          [sale.remaining_amount, sale.final_amount, sale.customer_id]
        );
      }

      // Update sale status
      const result = await client.query<ISale>(
        `UPDATE ${this.tableName} 
         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      logger.warn(`Sale cancelled: ${sale.sale_number} by ${cancelled_by}`);

      return result.rows[0];
    });
  }

  /**
   * Delete sale (hard delete - only drafts)
   */
  async hardDelete(id: string): Promise<void> {
    const sale = await this.findById(id);
    if (!sale) {
      throw new NotFoundError('فروش یافت نشد');
    }

    if (sale.status !== SaleStatus.DRAFT) {
      throw new ValidationError('فقط پیش‌فاکتورها قابل حذف هستند. از لغو استفاده کنید');
    }

    await query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);

    logger.warn(`Sale permanently deleted: ${sale.sale_number}`);
  }

  // ==========================================
  // CALCULATIONS
  // ==========================================

  /**
   * Calculate sale totals from items
   */
  private async calculateSaleTotals(
    items: ICreateSaleItem[],
    goldPrice: number
  ): Promise<{
    totalAmount: number;
    items: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      weight: number;
      carat: number;
      unit_price: number;
      wage: number;
      total_price: number;
    }>;
  }> {
    let totalAmount = 0;
    const calculatedItems = [];

    for (const item of items) {
      const product = await ProductModel.findById(item.product_id);
      if (!product) {
        throw new NotFoundError(`محصول با شناسه ${item.product_id} یافت نشد`);
      }

      if (!product.is_active) {
        throw new ValidationError(`محصول ${product.name} غیرفعال است`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new ValidationError(`موجودی ${product.name} کافی نیست`);
      }

      const itemTotal = product.selling_price * item.quantity;
      totalAmount += itemTotal;

      calculatedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        weight: product.weight,
        carat: product.carat,
        unit_price: product.selling_price,
        wage: product.wage,
        total_price: itemTotal,
      });
    }

    return { totalAmount, items: calculatedItems };
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if sale exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`,
      [id]
    );

    return result.rows[0]?.exists || false;
  }

  /**
   * Generate unique sale number
   */
  async generateSaleNumber(): Promise<string> {
    const prefix = 'ZM';
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
   * Get sale statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    totalAmount: number;
    totalRevenue: number;
    completed: number;
    pending: number;
    cancelled: number;
    averageSaleAmount: number;
    byStatus: Record<SaleStatus, number>;
    byPaymentMethod: Record<PaymentMethod, number>;
  }> {
    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE sale_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const [totalResult, statusResult, paymentResult] = await Promise.all([
      query<{
        count: string;
        total_amount: string;
        total_revenue: string;
        avg_amount: string;
      }>(
        `SELECT 
          COUNT(*) as count,
          COALESCE(SUM(final_amount), 0) as total_amount,
          COALESCE(SUM(paid_amount), 0) as total_revenue,
          COALESCE(AVG(final_amount), 0) as avg_amount
         FROM ${this.tableName} ${dateFilter}`,
        params
      ),
      query<{ status: SaleStatus; count: string }>(
        `SELECT status, COUNT(*) as count 
         FROM ${this.tableName} ${dateFilter}
         GROUP BY status`,
        params
      ),
      query<{ payment_method: PaymentMethod; count: string }>(
        `SELECT payment_method, COUNT(*) as count 
         FROM ${this.tableName} ${dateFilter}
         GROUP BY payment_method`,
        params
      ),
    ]);

    const total = parseInt(totalResult.rows[0]?.count || '0', 10);

    const byStatus: Record<SaleStatus, number> = {
      draft: 0,
      completed: 0,
      partial: 0,
      cancelled: 0,
      returned: 0,
    };

    statusResult.rows.forEach((row) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    const byPaymentMethod: Record<PaymentMethod, number> = {
      cash: 0,
      card: 0,
      transfer: 0,
      check: 0,
      mixed: 0,
    };

    paymentResult.rows.forEach((row) => {
      byPaymentMethod[row.payment_method] = parseInt(row.count, 10);
    });

    return {
      total,
      totalAmount: parseFloat(totalResult.rows[0]?.total_amount || '0'),
      totalRevenue: parseFloat(totalResult.rows[0]?.total_revenue || '0'),
      completed: byStatus.completed,
      pending: byStatus.draft + byStatus.partial,
      cancelled: byStatus.cancelled,
      averageSaleAmount: parseFloat(totalResult.rows[0]?.avg_amount || '0'),
      byStatus,
      byPaymentMethod,
    };
  }

  /**
   * Get today's sales
   */
  async getTodaySales(): Promise<ISale[]> {
    const result = await query<ISale>(
      `SELECT * FROM ${this.tableName} 
       WHERE DATE(sale_date) = CURRENT_DATE 
       ORDER BY sale_date DESC`
    );

    return result.rows;
  }

  /**
   * Get today's revenue
   */
  async getTodayRevenue(): Promise<number> {
    const result = await query<{ total: string }>(
      `SELECT COALESCE(SUM(final_amount), 0) as total 
       FROM ${this.tableName} 
       WHERE DATE(sale_date) = CURRENT_DATE 
       AND status IN ('completed', 'partial')`
    );

    return parseFloat(result.rows[0]?.total || '0');
  }
}

// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================

export default new SaleModel();