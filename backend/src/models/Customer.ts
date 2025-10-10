// ==========================================
// ZARMIND - Customer Model
// ==========================================

import { query, transaction, buildInsertQuery, buildUpdateQuery, PoolClient } from '../config/database';
import { ICustomer, ICustomerFilter, IQueryResult } from '../types';
import { NotFoundError, ConflictError, ValidationError } from '../types';
import logger from '../utils/logger';
import { sanitizePhoneNumber, generateUniqueCode } from '../utils/helpers';

// ==========================================
// INTERFACES
// ==========================================

export interface ICreateCustomer {
  full_name: string;
  phone: string;
  email?: string;
  national_id?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  birth_date?: Date;
  notes?: string;
  credit_limit?: number;
  is_active?: boolean;
}

export interface IUpdateCustomer {
  full_name?: string;
  phone?: string;
  email?: string;
  national_id?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  birth_date?: Date;
  notes?: string;
  credit_limit?: number;
  is_active?: boolean;
}

export interface IBalanceUpdate {
  customer_id: string;
  amount: number;
  type: 'increase' | 'decrease' | 'set';
  reason?: string;
  updated_by: string;
}

export interface ICustomerWithStats extends ICustomer {
  total_sales?: number;
  completed_orders?: number;
  pending_payments?: number;
}

// ==========================================
// CUSTOMER MODEL
// ==========================================

class CustomerModel {
  private tableName = 'customers';

  // ==========================================
  // CREATE
  // ==========================================

  /**
   * Create a new customer
   */
  async create(customerData: ICreateCustomer): Promise<ICustomer> {
    try {
      // Generate unique customer code
      const customer_code = await this.generateCustomerCode();

      // Sanitize phone number
      const phone = sanitizePhoneNumber(customerData.phone);

      // Check if phone already exists
      const existingPhone = await this.findByPhone(phone);
      if (existingPhone) {
        throw new ConflictError(`شماره تلفن "${customerData.phone}" قبلاً ثبت شده است`);
      }

      // Check if email exists (if provided)
      if (customerData.email) {
        const existingEmail = await this.findByEmail(customerData.email);
        if (existingEmail) {
          throw new ConflictError(`ایمیل "${customerData.email}" قبلاً ثبت شده است`);
        }
      }

      // Check if national_id exists (if provided)
      if (customerData.national_id) {
        const existingNationalId = await this.findByNationalId(customerData.national_id);
        if (existingNationalId) {
          throw new ConflictError(`کد ملی "${customerData.national_id}" قبلاً ثبت شده است`);
        }
      }

      // Prepare customer data
      const customerToInsert = {
        customer_code,
        full_name: customerData.full_name,
        phone,
        email: customerData.email || null,
        national_id: customerData.national_id || null,
        address: customerData.address || null,
        city: customerData.city || null,
        postal_code: customerData.postal_code || null,
        birth_date: customerData.birth_date || null,
        notes: customerData.notes || null,
        credit_limit: customerData.credit_limit || 0,
        balance: 0, // Initial balance is 0
        total_purchases: 0, // Initial purchases is 0
        is_active: customerData.is_active !== undefined ? customerData.is_active : true,
      };

      // Insert customer
      const result = await query<ICustomer>(
        `INSERT INTO ${this.tableName} 
        (customer_code, full_name, phone, email, national_id, address, city, 
         postal_code, birth_date, notes, credit_limit, balance, total_purchases, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          customerToInsert.customer_code,
          customerToInsert.full_name,
          customerToInsert.phone,
          customerToInsert.email,
          customerToInsert.national_id,
          customerToInsert.address,
          customerToInsert.city,
          customerToInsert.postal_code,
          customerToInsert.birth_date,
          customerToInsert.notes,
          customerToInsert.credit_limit,
          customerToInsert.balance,
          customerToInsert.total_purchases,
          customerToInsert.is_active,
        ]
      );

      const customer = result.rows[0];
      logger.info(`Customer created: ${customer.full_name} (${customer.customer_code})`);

      return customer;
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  // ==========================================
  // READ
  // ==========================================

  /**
   * Find customer by ID
   */
  async findById(id: string): Promise<ICustomer | null> {
    const result = await query<ICustomer>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find customer by customer code
   */
  async findByCode(customer_code: string): Promise<ICustomer | null> {
    const result = await query<ICustomer>(
      `SELECT * FROM ${this.tableName} WHERE customer_code = $1`,
      [customer_code]
    );

    return result.rows[0] || null;
  }

  /**
   * Find customer by phone
   */
  async findByPhone(phone: string): Promise<ICustomer | null> {
    const sanitizedPhone = sanitizePhoneNumber(phone);
    const result = await query<ICustomer>(
      `SELECT * FROM ${this.tableName} WHERE phone = $1`,
      [sanitizedPhone]
    );

    return result.rows[0] || null;
  }

  /**
   * Find customer by email
   */
  async findByEmail(email: string): Promise<ICustomer | null> {
    const result = await query<ICustomer>(
      `SELECT * FROM ${this.tableName} WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    return result.rows[0] || null;
  }

  /**
   * Find customer by national ID
   */
  async findByNationalId(national_id: string): Promise<ICustomer | null> {
    const result = await query<ICustomer>(
      `SELECT * FROM ${this.tableName} WHERE national_id = $1`,
      [national_id]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all customers with optional filters
   */
  async findAll(filters?: ICustomerFilter): Promise<ICustomer[]> {
    let sql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters?.search) {
      sql += ` AND (
        full_name ILIKE $${paramIndex} OR 
        phone ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        customer_code ILIKE $${paramIndex} OR
        national_id ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters?.city) {
      sql += ` AND city = $${paramIndex}`;
      params.push(filters.city);
      paramIndex++;
    }

    if (filters?.hasDebt !== undefined) {
      if (filters.hasDebt) {
        sql += ` AND balance > 0`;
      } else {
        sql += ` AND balance <= 0`;
      }
    }

    if (filters?.hasCredit !== undefined) {
      if (filters.hasCredit) {
        sql += ` AND balance < 0`;
      }
    }

    if (filters?.isActive !== undefined) {
      sql += ` AND is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query<ICustomer>(sql, params);
    return result.rows;
  }

  /**
   * Get customers with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 20,
    filters?: ICustomerFilter
  ): Promise<{ customers: ICustomer[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;

    let countSql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE 1=1`;
    let dataSql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters?.search) {
      const searchFilter = ` AND (
        full_name ILIKE $${paramIndex} OR 
        phone ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        customer_code ILIKE $${paramIndex} OR
        national_id ILIKE $${paramIndex}
      )`;
      countSql += searchFilter;
      dataSql += searchFilter;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters?.city) {
      const cityFilter = ` AND city = $${paramIndex}`;
      countSql += cityFilter;
      dataSql += cityFilter;
      params.push(filters.city);
      paramIndex++;
    }

    if (filters?.hasDebt !== undefined) {
      const debtFilter = filters.hasDebt ? ` AND balance > 0` : ` AND balance <= 0`;
      countSql += debtFilter;
      dataSql += debtFilter;
    }

    if (filters?.hasCredit !== undefined && filters.hasCredit) {
      const creditFilter = ` AND balance < 0`;
      countSql += creditFilter;
      dataSql += creditFilter;
    }

    if (filters?.isActive !== undefined) {
      const activeFilter = ` AND is_active = $${paramIndex}`;
      countSql += activeFilter;
      dataSql += activeFilter;
      params.push(filters.isActive);
      paramIndex++;
    }

    dataSql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataParams = [...params, limit, offset];

    // Execute queries
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(countSql, params),
      query<ICustomer>(dataSql, dataParams),
    ]);

    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    return {
      customers: dataResult.rows,
      total,
      page,
      limit,
    };
  }

  /**
   * Get customer with statistics
   */
  async findByIdWithStats(id: string): Promise<ICustomerWithStats | null> {
    const result = await query<ICustomerWithStats>(
      `SELECT 
        c.*,
        COUNT(s.id) as total_sales,
        COALESCE(SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_orders,
        COALESCE(SUM(CASE WHEN s.status = 'partial' THEN s.remaining_amount ELSE 0 END), 0) as pending_payments
       FROM ${this.tableName} c
       LEFT JOIN sales s ON c.id = s.customer_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Get customers with debt (بدهکار)
   */
  async findWithDebt(): Promise<ICustomer[]> {
    const result = await query<ICustomer>(
      `SELECT * FROM ${this.tableName} 
       WHERE balance > 0 AND is_active = true 
       ORDER BY balance DESC`
    );

    return result.rows;
  }

  /**
   * Get customers with credit (طلبکار)
   */
  async findWithCredit(): Promise<ICustomer[]> {
    const result = await query<ICustomer>(
      `SELECT * FROM ${this.tableName} 
       WHERE balance < 0 AND is_active = true 
       ORDER BY balance ASC`
    );

    return result.rows;
  }

  /**
   * Get top customers by purchases
   */
  async getTopCustomers(limit: number = 10): Promise<ICustomer[]> {
    const result = await query<ICustomer>(
      `SELECT * FROM ${this.tableName} 
       WHERE is_active = true 
       ORDER BY total_purchases DESC 
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Get customers by city
   */
  async findByCity(city: string): Promise<ICustomer[]> {
    const result = await query<ICustomer>(
      `SELECT * FROM ${this.tableName} 
       WHERE city = $1 AND is_active = true 
       ORDER BY full_name ASC`,
      [city]
    );

    return result.rows;
  }

  // ==========================================
  // UPDATE
  // ==========================================

  /**
   * Update customer by ID
   */
  async update(id: string, updateData: IUpdateCustomer): Promise<ICustomer> {
    const customer = await this.findById(id);
    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    // Check if phone is being changed and if it's already taken
    if (updateData.phone && updateData.phone !== customer.phone) {
      const sanitizedPhone = sanitizePhoneNumber(updateData.phone);
      const existingPhone = await this.findByPhone(sanitizedPhone);
      if (existingPhone && existingPhone.id !== id) {
        throw new ConflictError(`شماره تلفن "${updateData.phone}" قبلاً ثبت شده است`);
      }
      updateData.phone = sanitizedPhone;
    }

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== customer.email) {
      const existingEmail = await this.findByEmail(updateData.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictError(`ایمیل "${updateData.email}" قبلاً ثبت شده است`);
      }
    }

    // Check if national_id is being changed and if it's already taken
    if (updateData.national_id && updateData.national_id !== customer.national_id) {
      const existingNationalId = await this.findByNationalId(updateData.national_id);
      if (existingNationalId && existingNationalId.id !== id) {
        throw new ConflictError(`کد ملی "${updateData.national_id}" قبلاً ثبت شده است`);
      }
    }

    // Build update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.full_name !== undefined) {
      fields.push(`full_name = $${paramIndex}`);
      values.push(updateData.full_name);
      paramIndex++;
    }

    if (updateData.phone !== undefined) {
      fields.push(`phone = $${paramIndex}`);
      values.push(updateData.phone);
      paramIndex++;
    }

    if (updateData.email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      values.push(updateData.email);
      paramIndex++;
    }

    if (updateData.national_id !== undefined) {
      fields.push(`national_id = $${paramIndex}`);
      values.push(updateData.national_id);
      paramIndex++;
    }

    if (updateData.address !== undefined) {
      fields.push(`address = $${paramIndex}`);
      values.push(updateData.address);
      paramIndex++;
    }

    if (updateData.city !== undefined) {
      fields.push(`city = $${paramIndex}`);
      values.push(updateData.city);
      paramIndex++;
    }

    if (updateData.postal_code !== undefined) {
      fields.push(`postal_code = $${paramIndex}`);
      values.push(updateData.postal_code);
      paramIndex++;
    }

    if (updateData.birth_date !== undefined) {
      fields.push(`birth_date = $${paramIndex}`);
      values.push(updateData.birth_date);
      paramIndex++;
    }

    if (updateData.notes !== undefined) {
      fields.push(`notes = $${paramIndex}`);
      values.push(updateData.notes);
      paramIndex++;
    }

    if (updateData.credit_limit !== undefined) {
      fields.push(`credit_limit = $${paramIndex}`);
      values.push(updateData.credit_limit);
      paramIndex++;
    }

    if (updateData.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex}`);
      values.push(updateData.is_active);
      paramIndex++;
    }

    if (fields.length === 0) {
      return customer; // No changes
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `
      UPDATE ${this.tableName} 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query<ICustomer>(sql, values);
    const updatedCustomer = result.rows[0];

    logger.info(`Customer updated: ${updatedCustomer.full_name} (${updatedCustomer.customer_code})`);

    return updatedCustomer;
  }

  /**
   * Activate/Deactivate customer
   */
  async setActiveStatus(id: string, isActive: boolean): Promise<ICustomer> {
    const result = await query<ICustomer>(
      `UPDATE ${this.tableName} 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [isActive, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    const customer = result.rows[0];
    logger.info(`Customer ${isActive ? 'activated' : 'deactivated'}: ${customer.full_name} (${customer.customer_code})`);

    return customer;
  }

  // ==========================================
  // BALANCE MANAGEMENT
  // ==========================================

  /**
   * Update customer balance
   */
  async updateBalance(id: string, amount: number): Promise<ICustomer> {
    const customer = await this.findById(id);
    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    // Check credit limit
    if (amount > 0 && customer.credit_limit > 0) {
      if (amount > customer.credit_limit) {
        throw new ValidationError('مبلغ از سقف اعتبار بیشتر است');
      }
    }

    const result = await query<ICustomer>(
      `UPDATE ${this.tableName} 
       SET balance = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [amount, id]
    );

    logger.info(`Customer balance updated: ${id} - New balance: ${amount}`);
    return result.rows[0];
  }

  /**
   * Increase customer balance (add debt)
   */
  async increaseBalance(id: string, amount: number): Promise<ICustomer> {
    if (amount <= 0) {
      throw new ValidationError('مبلغ افزایش باید مثبت باشد');
    }

    const customer = await this.findById(id);
    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    const newBalance = customer.balance + amount;

    // Check credit limit
    if (customer.credit_limit > 0 && newBalance > customer.credit_limit) {
      throw new ValidationError('افزایش بدهی از سقف اعتبار فراتر می‌رود');
    }

    const result = await query<ICustomer>(
      `UPDATE ${this.tableName} 
       SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [amount, id]
    );

    logger.info(`Customer balance increased: ${id} - Amount: +${amount}`);
    return result.rows[0];
  }

  /**
   * Decrease customer balance (reduce debt / add credit)
   */
  async decreaseBalance(id: string, amount: number): Promise<ICustomer> {
    if (amount <= 0) {
      throw new ValidationError('مبلغ کاهش باید مثبت باشد');
    }

    const result = await query<ICustomer>(
      `UPDATE ${this.tableName} 
       SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [amount, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    logger.info(`Customer balance decreased: ${id} - Amount: -${amount}`);
    return result.rows[0];
  }

  /**
   * Adjust balance with validation
   */
  async adjustBalance(adjustment: IBalanceUpdate): Promise<ICustomer> {
    const { customer_id, amount, type, reason, updated_by } = adjustment;

    let updatedCustomer: ICustomer;

    switch (type) {
      case 'increase':
        updatedCustomer = await this.increaseBalance(customer_id, amount);
        break;
      case 'decrease':
        updatedCustomer = await this.decreaseBalance(customer_id, amount);
        break;
      case 'set':
        updatedCustomer = await this.updateBalance(customer_id, amount);
        break;
      default:
        throw new ValidationError('نوع تعدیل موجودی نامعتبر است');
    }

    logger.info(`Balance adjusted: ${customer_id} - ${type} ${amount} by ${updated_by}`, {
      reason,
    });

    return updatedCustomer;
  }

  /**
   * Update total purchases
   */
  async updateTotalPurchases(id: string, amount: number): Promise<ICustomer> {
    const result = await query<ICustomer>(
      `UPDATE ${this.tableName} 
       SET total_purchases = total_purchases + $1, 
           last_purchase_date = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [amount, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    return result.rows[0];
  }

  // ==========================================
  // DELETE
  // ==========================================

  /**
   * Delete customer by ID (soft delete - deactivate)
   */
  async softDelete(id: string): Promise<void> {
    await this.setActiveStatus(id, false);
  }

  /**
   * Delete customer by ID (hard delete - permanent)
   */
  async hardDelete(id: string): Promise<void> {
    const customer = await this.findById(id);
    if (!customer) {
      throw new NotFoundError('مشتری یافت نشد');
    }

    // Check if customer has any sales
    const salesResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM sales WHERE customer_id = $1',
      [id]
    );

    const salesCount = parseInt(salesResult.rows[0]?.count || '0', 10);

    if (salesCount > 0) {
      throw new ValidationError(
        'نمی‌توان مشتری با سابقه فروش را حذف کرد. از غیرفعال کردن استفاده کنید'
      );
    }

    const result = await query(
      `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id, full_name, customer_code`,
      [id]
    );

    logger.warn(`Customer permanently deleted: ${customer.full_name} (${customer.customer_code})`);
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if customer exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`,
      [id]
    );

    return result.rows[0]?.exists || false;
  }

  /**
   * Generate unique customer code
   */
  async generateCustomerCode(): Promise<string> {
    let code: string;
    let exists: boolean;

    do {
      code = `CUST-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 5)
        .toUpperCase()}`;
      exists = await this.codeExists(code);
    } while (exists);

    return code;
  }

  /**
   * Check if customer code exists
   */
  async codeExists(code: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE customer_code = $1)`,
      [code]
    );

    return result.rows[0]?.exists || false;
  }

  /**
   * Get customer statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withDebt: number;
    withCredit: number;
    totalDebt: number;
    totalCredit: number;
    totalPurchases: number;
    topCities: Array<{ city: string; count: number }>;
  }> {
    const [
      totalResult,
      activeResult,
      debtResult,
      creditResult,
      totalDebtResult,
      totalCreditResult,
      totalPurchasesResult,
      topCitiesResult,
    ] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) as count FROM ${this.tableName}`),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE is_active = true`
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE balance > 0`
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE balance < 0`
      ),
      query<{ total: string }>(
        `SELECT SUM(balance) as total FROM ${this.tableName} WHERE balance > 0`
      ),
      query<{ total: string }>(
        `SELECT ABS(SUM(balance)) as total FROM ${this.tableName} WHERE balance < 0`
      ),
      query<{ total: string }>(
        `SELECT SUM(total_purchases) as total FROM ${this.tableName}`
      ),
      query<{ city: string; count: string }>(
        `SELECT city, COUNT(*) as count 
         FROM ${this.tableName} 
         WHERE city IS NOT NULL AND is_active = true
         GROUP BY city 
         ORDER BY count DESC 
         LIMIT 10`
      ),
    ]);

    const total = parseInt(totalResult.rows[0]?.count || '0', 10);
    const active = parseInt(activeResult.rows[0]?.count || '0', 10);

    return {
      total,
      active,
      inactive: total - active,
      withDebt: parseInt(debtResult.rows[0]?.count || '0', 10),
      withCredit: parseInt(creditResult.rows[0]?.count || '0', 10),
      totalDebt: parseFloat(totalDebtResult.rows[0]?.total || '0'),
      totalCredit: parseFloat(totalCreditResult.rows[0]?.total || '0'),
      totalPurchases: parseFloat(totalPurchasesResult.rows[0]?.total || '0'),
      topCities: topCitiesResult.rows.map((row) => ({
        city: row.city,
        count: parseInt(row.count, 10),
      })),
    };
  }

  /**
   * Search customers
   */
  async search(searchTerm: string, limit: number = 10): Promise<ICustomer[]> {
    const result = await query<ICustomer>(
      `SELECT * FROM ${this.tableName} 
       WHERE (
         full_name ILIKE $1 OR 
         phone ILIKE $1 OR 
         customer_code ILIKE $1
       ) AND is_active = true 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );

    return result.rows;
  }

  /**
   * Get customer purchase history summary
   */
  async getPurchaseHistory(customerId: string): Promise<{
    totalOrders: number;
    totalAmount: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
  }> {
    const result = await query<{
      total_orders: string;
      total_amount: string;
      completed_orders: string;
      pending_orders: string;
      cancelled_orders: string;
    }>(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(final_amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_orders,
        COALESCE(SUM(CASE WHEN status IN ('draft', 'partial') THEN 1 ELSE 0 END), 0) as pending_orders,
        COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_orders
       FROM sales 
       WHERE customer_id = $1`,
      [customerId]
    );

    const row = result.rows[0];

    return {
      totalOrders: parseInt(row?.total_orders || '0', 10),
      totalAmount: parseFloat(row?.total_amount || '0'),
      completedOrders: parseInt(row?.completed_orders || '0', 10),
      pendingOrders: parseInt(row?.pending_orders || '0', 10),
      cancelledOrders: parseInt(row?.cancelled_orders || '0', 10),
    };
  }
}

// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================

export default new CustomerModel();