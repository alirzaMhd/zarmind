// ==========================================
// ZARMIND - Product Model
// ==========================================

import { query, transaction, buildInsertQuery, buildUpdateQuery, PoolClient } from '../config/database';
import {
  IProduct,
  ProductCategory,
  ProductType,
  IProductFilter,
  IQueryResult,
} from '../types';
import { NotFoundError, ConflictError, ValidationError } from '../types';
import logger from '../utils/logger';
import { generateUniqueCode } from '../utils/helpers';

// ==========================================
// INTERFACES
// ==========================================

export interface ICreateProduct {
  name: string;
  name_en?: string;
  category: ProductCategory;
  type: ProductType;
  carat: number;
  weight: number;
  wage?: number;
  stone_price?: number;
  description?: string;
  image_url?: string;
  stock_quantity?: number;
  min_stock_level?: number;
  location?: string;
  supplier?: string;
  purchase_price?: number;
  selling_price: number;
  created_by: string;
  is_active?: boolean;
}

export interface IUpdateProduct {
  name?: string;
  name_en?: string;
  category?: ProductCategory;
  type?: ProductType;
  carat?: number;
  weight?: number;
  wage?: number;
  stone_price?: number;
  description?: string;
  image_url?: string;
  stock_quantity?: number;
  min_stock_level?: number;
  location?: string;
  supplier?: string;
  purchase_price?: number;
  selling_price?: number;
  is_active?: boolean;
}

export interface IProductWithPrice extends IProduct {
  current_gold_price?: number;
  calculated_price?: number;
}

export interface IStockAdjustment {
  product_id: string;
  quantity: number;
  type: 'increase' | 'decrease' | 'set';
  reason?: string;
  adjusted_by: string;
}

// ==========================================
// PRODUCT MODEL
// ==========================================

class ProductModel {
  private tableName = 'products';

  // ==========================================
  // CREATE
  // ==========================================

  /**
   * Create a new product
   */
  async create(productData: ICreateProduct): Promise<IProduct> {
    try {
      // Generate unique product code if not provided
      const code = this.generateProductCode(productData.category, productData.type);

      // Check if code already exists
      const existingProduct = await this.findByCode(code);
      if (existingProduct) {
        // Retry with new code
        return this.create(productData);
      }

      // Prepare product data
      const productToInsert = {
        code,
        name: productData.name,
        name_en: productData.name_en || null,
        category: productData.category,
        type: productData.type,
        carat: productData.carat,
        weight: productData.weight,
        wage: productData.wage || 0,
        stone_price: productData.stone_price || 0,
        description: productData.description || null,
        image_url: productData.image_url || null,
        stock_quantity: productData.stock_quantity !== undefined ? productData.stock_quantity : 1,
        min_stock_level: productData.min_stock_level || 0,
        location: productData.location || null,
        supplier: productData.supplier || null,
        purchase_price: productData.purchase_price || null,
        selling_price: productData.selling_price,
        is_active: productData.is_active !== undefined ? productData.is_active : true,
        created_by: productData.created_by,
      };

      // Insert product
      const result = await query<IProduct>(
        `INSERT INTO ${this.tableName} 
        (code, name, name_en, category, type, carat, weight, wage, stone_price, 
         description, image_url, stock_quantity, min_stock_level, location, 
         supplier, purchase_price, selling_price, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          productToInsert.code,
          productToInsert.name,
          productToInsert.name_en,
          productToInsert.category,
          productToInsert.type,
          productToInsert.carat,
          productToInsert.weight,
          productToInsert.wage,
          productToInsert.stone_price,
          productToInsert.description,
          productToInsert.image_url,
          productToInsert.stock_quantity,
          productToInsert.min_stock_level,
          productToInsert.location,
          productToInsert.supplier,
          productToInsert.purchase_price,
          productToInsert.selling_price,
          productToInsert.is_active,
          productToInsert.created_by,
        ]
      );

      const product = result.rows[0];
      logger.info(`Product created: ${product.name} (${product.code})`);

      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  // ==========================================
  // READ
  // ==========================================

  /**
   * Find product by ID
   */
  async findById(id: string): Promise<IProduct | null> {
    const result = await query<IProduct>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find product by code
   */
  async findByCode(code: string): Promise<IProduct | null> {
    const result = await query<IProduct>(
      `SELECT * FROM ${this.tableName} WHERE code = $1`,
      [code]
    );

    return result.rows[0] || null;
  }

  /**
   * Find product by ID with current gold price
   */
  async findByIdWithPrice(id: string): Promise<IProductWithPrice | null> {
    const result = await query<IProductWithPrice>(
      `SELECT 
        p.*,
        gp.price_per_gram as current_gold_price,
        (p.weight * gp.price_per_gram * (p.carat::DECIMAL / 24) + p.wage + p.stone_price) as calculated_price
       FROM ${this.tableName} p
       LEFT JOIN LATERAL (
         SELECT price_per_gram
         FROM gold_prices
         WHERE carat = p.carat
         ORDER BY date DESC
         LIMIT 1
       ) gp ON true
       WHERE p.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all products with optional filters
   */
  async findAll(filters?: IProductFilter): Promise<IProduct[]> {
    let sql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters?.category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.type) {
      sql += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters?.carat) {
      sql += ` AND carat = $${paramIndex}`;
      params.push(filters.carat);
      paramIndex++;
    }

    if (filters?.minWeight !== undefined) {
      sql += ` AND weight >= $${paramIndex}`;
      params.push(filters.minWeight);
      paramIndex++;
    }

    if (filters?.maxWeight !== undefined) {
      sql += ` AND weight <= $${paramIndex}`;
      params.push(filters.maxWeight);
      paramIndex++;
    }

    if (filters?.minPrice !== undefined) {
      sql += ` AND selling_price >= $${paramIndex}`;
      params.push(filters.minPrice);
      paramIndex++;
    }

    if (filters?.maxPrice !== undefined) {
      sql += ` AND selling_price <= $${paramIndex}`;
      params.push(filters.maxPrice);
      paramIndex++;
    }

    if (filters?.isActive !== undefined) {
      sql += ` AND is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex++;
    }

    if (filters?.lowStock) {
      sql += ` AND stock_quantity <= min_stock_level`;
    }

    if (filters?.search) {
      sql += ` AND (
        name ILIKE $${paramIndex} OR 
        name_en ILIKE $${paramIndex} OR 
        code ILIKE $${paramIndex} OR
        description ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query<IProduct>(sql, params);
    return result.rows;
  }

  /**
   * Get products with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 20,
    filters?: IProductFilter
  ): Promise<{ products: IProduct[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;

    let countSql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE 1=1`;
    let dataSql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters (same as findAll)
    if (filters?.category) {
      const categoryFilter = ` AND category = $${paramIndex}`;
      countSql += categoryFilter;
      dataSql += categoryFilter;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.type) {
      const typeFilter = ` AND type = $${paramIndex}`;
      countSql += typeFilter;
      dataSql += typeFilter;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters?.carat) {
      const caratFilter = ` AND carat = $${paramIndex}`;
      countSql += caratFilter;
      dataSql += caratFilter;
      params.push(filters.carat);
      paramIndex++;
    }

    if (filters?.minWeight !== undefined) {
      const minWeightFilter = ` AND weight >= $${paramIndex}`;
      countSql += minWeightFilter;
      dataSql += minWeightFilter;
      params.push(filters.minWeight);
      paramIndex++;
    }

    if (filters?.maxWeight !== undefined) {
      const maxWeightFilter = ` AND weight <= $${paramIndex}`;
      countSql += maxWeightFilter;
      dataSql += maxWeightFilter;
      params.push(filters.maxWeight);
      paramIndex++;
    }

    if (filters?.minPrice !== undefined) {
      const minPriceFilter = ` AND selling_price >= $${paramIndex}`;
      countSql += minPriceFilter;
      dataSql += minPriceFilter;
      params.push(filters.minPrice);
      paramIndex++;
    }

    if (filters?.maxPrice !== undefined) {
      const maxPriceFilter = ` AND selling_price <= $${paramIndex}`;
      countSql += maxPriceFilter;
      dataSql += maxPriceFilter;
      params.push(filters.maxPrice);
      paramIndex++;
    }

    if (filters?.isActive !== undefined) {
      const activeFilter = ` AND is_active = $${paramIndex}`;
      countSql += activeFilter;
      dataSql += activeFilter;
      params.push(filters.isActive);
      paramIndex++;
    }

    if (filters?.lowStock) {
      const lowStockFilter = ` AND stock_quantity <= min_stock_level`;
      countSql += lowStockFilter;
      dataSql += lowStockFilter;
    }

    if (filters?.search) {
      const searchFilter = ` AND (
        name ILIKE $${paramIndex} OR 
        name_en ILIKE $${paramIndex} OR 
        code ILIKE $${paramIndex} OR
        description ILIKE $${paramIndex}
      )`;
      countSql += searchFilter;
      dataSql += searchFilter;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    dataSql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataParams = [...params, limit, offset];

    // Execute queries
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(countSql, params),
      query<IProduct>(dataSql, dataParams),
    ]);

    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    return {
      products: dataResult.rows,
      total,
      page,
      limit,
    };
  }

  /**
   * Get products by category
   */
  async findByCategory(category: ProductCategory): Promise<IProduct[]> {
    const result = await query<IProduct>(
      `SELECT * FROM ${this.tableName} 
       WHERE category = $1 AND is_active = true 
       ORDER BY created_at DESC`,
      [category]
    );

    return result.rows;
  }

  /**
   * Get products by type
   */
  async findByType(type: ProductType): Promise<IProduct[]> {
    const result = await query<IProduct>(
      `SELECT * FROM ${this.tableName} 
       WHERE type = $1 AND is_active = true 
       ORDER BY created_at DESC`,
      [type]
    );

    return result.rows;
  }

  /**
   * Get low stock products
   */
  async findLowStock(): Promise<IProduct[]> {
    const result = await query<IProduct>(
      `SELECT * FROM ${this.tableName} 
       WHERE stock_quantity <= min_stock_level AND is_active = true 
       ORDER BY stock_quantity ASC`
    );

    return result.rows;
  }

  /**
   * Get out of stock products
   */
  async findOutOfStock(): Promise<IProduct[]> {
    const result = await query<IProduct>(
      `SELECT * FROM ${this.tableName} 
       WHERE stock_quantity = 0 AND is_active = true 
       ORDER BY created_at DESC`
    );

    return result.rows;
  }

  // ==========================================
  // UPDATE
  // ==========================================

  /**
   * Update product by ID
   */
  async update(id: string, updateData: IUpdateProduct): Promise<IProduct> {
    const product = await this.findById(id);
    if (!product) {
      throw new NotFoundError('محصول یافت نشد');
    }

    // Build update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      values.push(updateData.name);
      paramIndex++;
    }

    if (updateData.name_en !== undefined) {
      fields.push(`name_en = $${paramIndex}`);
      values.push(updateData.name_en);
      paramIndex++;
    }

    if (updateData.category !== undefined) {
      fields.push(`category = $${paramIndex}`);
      values.push(updateData.category);
      paramIndex++;
    }

    if (updateData.type !== undefined) {
      fields.push(`type = $${paramIndex}`);
      values.push(updateData.type);
      paramIndex++;
    }

    if (updateData.carat !== undefined) {
      fields.push(`carat = $${paramIndex}`);
      values.push(updateData.carat);
      paramIndex++;
    }

    if (updateData.weight !== undefined) {
      fields.push(`weight = $${paramIndex}`);
      values.push(updateData.weight);
      paramIndex++;
    }

    if (updateData.wage !== undefined) {
      fields.push(`wage = $${paramIndex}`);
      values.push(updateData.wage);
      paramIndex++;
    }

    if (updateData.stone_price !== undefined) {
      fields.push(`stone_price = $${paramIndex}`);
      values.push(updateData.stone_price);
      paramIndex++;
    }

    if (updateData.description !== undefined) {
      fields.push(`description = $${paramIndex}`);
      values.push(updateData.description);
      paramIndex++;
    }

    if (updateData.image_url !== undefined) {
      fields.push(`image_url = $${paramIndex}`);
      values.push(updateData.image_url);
      paramIndex++;
    }

    if (updateData.stock_quantity !== undefined) {
      fields.push(`stock_quantity = $${paramIndex}`);
      values.push(updateData.stock_quantity);
      paramIndex++;
    }

    if (updateData.min_stock_level !== undefined) {
      fields.push(`min_stock_level = $${paramIndex}`);
      values.push(updateData.min_stock_level);
      paramIndex++;
    }

    if (updateData.location !== undefined) {
      fields.push(`location = $${paramIndex}`);
      values.push(updateData.location);
      paramIndex++;
    }

    if (updateData.supplier !== undefined) {
      fields.push(`supplier = $${paramIndex}`);
      values.push(updateData.supplier);
      paramIndex++;
    }

    if (updateData.purchase_price !== undefined) {
      fields.push(`purchase_price = $${paramIndex}`);
      values.push(updateData.purchase_price);
      paramIndex++;
    }

    if (updateData.selling_price !== undefined) {
      fields.push(`selling_price = $${paramIndex}`);
      values.push(updateData.selling_price);
      paramIndex++;
    }

    if (updateData.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex}`);
      values.push(updateData.is_active);
      paramIndex++;
    }

    if (fields.length === 0) {
      return product; // No changes
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `
      UPDATE ${this.tableName} 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query<IProduct>(sql, values);
    const updatedProduct = result.rows[0];

    logger.info(`Product updated: ${updatedProduct.name} (${updatedProduct.code})`);

    return updatedProduct;
  }

  /**
   * Update product image
   */
  async updateImage(id: string, imageUrl: string): Promise<IProduct> {
    const result = await query<IProduct>(
      `UPDATE ${this.tableName} 
       SET image_url = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [imageUrl, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('محصول یافت نشد');
    }

    return result.rows[0];
  }

  /**
   * Activate/Deactivate product
   */
  async setActiveStatus(id: string, isActive: boolean): Promise<IProduct> {
    const result = await query<IProduct>(
      `UPDATE ${this.tableName} 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [isActive, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('محصول یافت نشد');
    }

    const product = result.rows[0];
    logger.info(`Product ${isActive ? 'activated' : 'deactivated'}: ${product.name} (${product.code})`);

    return product;
  }

  // ==========================================
  // STOCK MANAGEMENT
  // ==========================================

  /**
   * Update stock quantity
   */
  async updateStock(id: string, quantity: number): Promise<IProduct> {
    if (quantity < 0) {
      throw new ValidationError('موجودی نمی‌تواند منفی باشد');
    }

    const result = await query<IProduct>(
      `UPDATE ${this.tableName} 
       SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('محصول یافت نشد');
    }

    return result.rows[0];
  }

  /**
   * Increase stock
   */
  async increaseStock(id: string, amount: number): Promise<IProduct> {
    if (amount <= 0) {
      throw new ValidationError('مقدار افزایش باید مثبت باشد');
    }

    const result = await query<IProduct>(
      `UPDATE ${this.tableName} 
       SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [amount, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('محصول یافت نشد');
    }

    logger.info(`Stock increased for product ${id}: +${amount}`);
    return result.rows[0];
  }

  /**
   * Decrease stock
   */
  async decreaseStock(id: string, amount: number): Promise<IProduct> {
    if (amount <= 0) {
      throw new ValidationError('مقدار کاهش باید مثبت باشد');
    }

    const product = await this.findById(id);
    if (!product) {
      throw new NotFoundError('محصول یافت نشد');
    }

    if (product.stock_quantity < amount) {
      throw new ValidationError('موجودی کافی نیست');
    }

    const result = await query<IProduct>(
      `UPDATE ${this.tableName} 
       SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [amount, id]
    );

    logger.info(`Stock decreased for product ${id}: -${amount}`);
    return result.rows[0];
  }

  /**
   * Adjust stock with validation
   */
  async adjustStock(adjustment: IStockAdjustment): Promise<IProduct> {
    const { product_id, quantity, type, reason, adjusted_by } = adjustment;

    let updatedProduct: IProduct;

    switch (type) {
      case 'increase':
        updatedProduct = await this.increaseStock(product_id, quantity);
        break;
      case 'decrease':
        updatedProduct = await this.decreaseStock(product_id, quantity);
        break;
      case 'set':
        updatedProduct = await this.updateStock(product_id, quantity);
        break;
      default:
        throw new ValidationError('نوع تعدیل موجودی نامعتبر است');
    }

    logger.info(`Stock adjusted: ${product_id} - ${type} ${quantity} by ${adjusted_by}`, {
      reason,
    });

    return updatedProduct;
  }

  // ==========================================
  // DELETE
  // ==========================================

  /**
   * Delete product by ID (soft delete - deactivate)
   */
  async softDelete(id: string): Promise<void> {
    await this.setActiveStatus(id, false);
  }

  /**
   * Delete product by ID (hard delete - permanent)
   */
  async hardDelete(id: string): Promise<void> {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id, name, code`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('محصول یافت نشد');
    }

    logger.warn(`Product permanently deleted: ${result.rows[0].name} (${result.rows[0].code})`);
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if product exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`,
      [id]
    );

    return result.rows[0]?.exists || false;
  }

  /**
   * Check if product code exists
   */
  async codeExists(code: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE code = $1)`,
      [code]
    );

    return result.rows[0]?.exists || false;
  }

  /**
   * Generate unique product code
   */
  generateProductCode(category: ProductCategory, type: ProductType): string {
    const categoryPrefix = category.substring(0, 2).toUpperCase();
    const typePrefix = type.substring(0, 2).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${categoryPrefix}${typePrefix}-${random}`;
  }

  /**
   * Get product statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
    totalWeight: number;
    byCategory: Record<ProductCategory, number>;
    byType: Record<ProductType, number>;
  }> {
    const [
      totalResult,
      activeResult,
      lowStockResult,
      outOfStockResult,
      valueResult,
      byCategoryResult,
      byTypeResult,
    ] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) as count FROM ${this.tableName}`),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE is_active = true`
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${this.tableName} 
         WHERE stock_quantity <= min_stock_level AND is_active = true`
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${this.tableName} 
         WHERE stock_quantity = 0 AND is_active = true`
      ),
      query<{ total_value: string; total_weight: string }>(
        `SELECT 
          SUM(selling_price * stock_quantity) as total_value,
          SUM(weight * stock_quantity) as total_weight
         FROM ${this.tableName} 
         WHERE is_active = true`
      ),
      query<{ category: ProductCategory; count: string }>(
        `SELECT category, COUNT(*) as count 
         FROM ${this.tableName} 
         WHERE is_active = true
         GROUP BY category`
      ),
      query<{ type: ProductType; count: string }>(
        `SELECT type, COUNT(*) as count 
         FROM ${this.tableName} 
         WHERE is_active = true
         GROUP BY type`
      ),
    ]);

    const total = parseInt(totalResult.rows[0]?.count || '0', 10);
    const active = parseInt(activeResult.rows[0]?.count || '0', 10);

    const byCategory: Record<ProductCategory, number> = {
      gold: 0,
      silver: 0,
      platinum: 0,
      diamond: 0,
      gemstone: 0,
    };

    byCategoryResult.rows.forEach((row) => {
      byCategory[row.category] = parseInt(row.count, 10);
    });

    const byType: Record<ProductType, number> = {
      ring: 0,
      necklace: 0,
      bracelet: 0,
      earring: 0,
      anklet: 0,
      bangle: 0,
      chain: 0,
      pendant: 0,
      coin: 0,
      bar: 0,
      set: 0,
      other: 0,
    };

    byTypeResult.rows.forEach((row) => {
      byType[row.type] = parseInt(row.count, 10);
    });

    return {
      total,
      active,
      inactive: total - active,
      lowStock: parseInt(lowStockResult.rows[0]?.count || '0', 10),
      outOfStock: parseInt(outOfStockResult.rows[0]?.count || '0', 10),
      totalValue: parseFloat(valueResult.rows[0]?.total_value || '0'),
      totalWeight: parseFloat(valueResult.rows[0]?.total_weight || '0'),
      byCategory,
      byType,
    };
  }

  /**
   * Get total inventory value
   */
  async getTotalValue(): Promise<number> {
    const result = await query<{ total: string }>(
      `SELECT SUM(selling_price * stock_quantity) as total 
       FROM ${this.tableName} 
       WHERE is_active = true`
    );

    return parseFloat(result.rows[0]?.total || '0');
  }

  /**
   * Get total inventory weight
   */
  async getTotalWeight(): Promise<number> {
    const result = await query<{ total: string }>(
      `SELECT SUM(weight * stock_quantity) as total 
       FROM ${this.tableName} 
       WHERE is_active = true`
    );

    return parseFloat(result.rows[0]?.total || '0');
  }

  /**
   * Search products by name or code
   */
  async search(searchTerm: string, limit: number = 10): Promise<IProduct[]> {
    const result = await query<IProduct>(
      `SELECT * FROM ${this.tableName} 
       WHERE (name ILIKE $1 OR code ILIKE $1) AND is_active = true 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );

    return result.rows;
  }
}

// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================

export default new ProductModel();