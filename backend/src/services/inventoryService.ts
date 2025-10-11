// ==========================================
// ZARMIND - Inventory Service
// ==========================================

import ProductModel, { ICreateProduct, IUpdateProduct } from '../models/Product';
import AuditLogModel from '../models/AuditLog';
import {
  IProduct,
  IProductFilter,
  ProductCategory,
  ProductType,
  EntityType,
  NotFoundError,
  ValidationError,
  IProductWithPrice,
} from '../types';
import logger from '../utils/logger';
import { calculateGoldPrice, formatPrice } from '../utils/helpers';
import { query } from '../config/database';

// ==========================================
// INTERFACES
// ==========================================

export interface IProductCreateData extends Omit<ICreateProduct, 'created_by'> {
  // Optional override for auto-calculated price
  override_price?: boolean;
}

export interface IStockUpdateData {
  product_id: string;
  quantity: number;
  type: 'increase' | 'decrease' | 'set';
  reason?: string;
  updated_by: string;
}

export interface IGoldPriceData {
  carat: number;
  price_per_gram: number;
  date?: Date;
  created_by: string;
}

export interface IInventoryReport {
  totalProducts: number;
  totalValue: number;
  totalWeight: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  byCategory: Record<ProductCategory, { count: number; value: number; weight: number }>;
  byType: Record<ProductType, { count: number; value: number }>;
  topProducts: Array<{
    id: string;
    name: string;
    value: number;
    stock: number;
  }>;
}

export interface IBulkPriceUpdate {
  category?: ProductCategory;
  type?: ProductType;
  percentage: number; // Increase or decrease percentage
  updated_by: string;
}

// ==========================================
// INVENTORY SERVICE
// ==========================================

class InventoryService {
  // ==========================================
  // PRODUCT CRUD
  // ==========================================

  /**
   * Create a new product
   */
  async createProduct(
    productData: IProductCreateData,
    created_by: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<IProduct> {
    try {
      // Validate carat
      if (![18, 21, 22, 24].includes(productData.carat)) {
        throw new ValidationError('عیار باید 18، 21، 22 یا 24 باشد');
      }

      // Validate weight
      if (productData.weight <= 0) {
        throw new ValidationError('وزن باید مثبت باشد');
      }

      // Calculate selling price if not provided or not overridden
      if (!productData.override_price && !productData.selling_price) {
        const goldPrice = await this.getCurrentGoldPrice(productData.carat);
        if (goldPrice) {
          productData.selling_price = calculateGoldPrice(
            productData.weight,
            productData.carat,
            goldPrice,
            productData.wage || 0,
            productData.stone_price || 0
          );
        } else {
          throw new ValidationError(
            'قیمت طلا برای این عیار یافت نشد. لطفاً قیمت فروش را مشخص کنید'
          );
        }
      }

      // Create product
      const product = await ProductModel.create({
        ...productData,
        created_by,
      });

      // Log creation
      await AuditLogModel.logCreate(
        created_by,
        EntityType.PRODUCT,
        product.id,
        product,
        ip_address,
        user_agent
      );

      logger.info(`Product created: ${product.name} (${product.code}) by ${created_by}`);

      return product;
    } catch (error) {
      logger.error('Error in createProduct:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(
    id: string,
    user_id?: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<IProduct> {
    const product = await ProductModel.findById(id);

    if (!product) {
      throw new NotFoundError('محصول یافت نشد');
    }

    // Log view (optional - can be disabled for performance)
    if (user_id) {
      await AuditLogModel.logView(
        user_id,
        EntityType.PRODUCT,
        id,
        ip_address,
        user_agent
      );
    }

    return product;
  }

  /**
   * Get product by ID with current gold price calculation
   */
  async getProductByIdWithPrice(id: string): Promise<IProductWithPrice> {
    const product = await ProductModel.findByIdWithPrice(id);

    if (!product) {
      throw new NotFoundError('محصول یافت نشد');
    }

    return product;
  }

  /**
   * Get all products with filters
   */
  async getProducts(filters?: IProductFilter): Promise<IProduct[]> {
    return ProductModel.findAll(filters);
  }

  /**
   * Get products with pagination
   */
  async getProductsWithPagination(
    page: number = 1,
    limit: number = 20,
    filters?: IProductFilter
  ) {
    return ProductModel.findWithPagination(page, limit, filters);
  }

  /**
   * Update product
   */
  async updateProduct(
    id: string,
    updateData: IUpdateProduct,
    updated_by: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<IProduct> {
    try {
      // Get old product for audit
      const oldProduct = await ProductModel.findById(id);
      if (!oldProduct) {
        throw new NotFoundError('محصول یافت نشد');
      }

      // Validate carat if being updated
      if (updateData.carat && ![18, 21, 22, 24].includes(updateData.carat)) {
        throw new ValidationError('عیار باید 18، 21، 22 یا 24 باشد');
      }

      // Validate weight if being updated
      if (updateData.weight !== undefined && updateData.weight <= 0) {
        throw new ValidationError('وزن باید مثبت باشد');
      }

      // Update product
      const updatedProduct = await ProductModel.update(id, updateData);

      // Log update
      await AuditLogModel.logUpdate(
        updated_by,
        EntityType.PRODUCT,
        id,
        oldProduct,
        updatedProduct,
        ip_address,
        user_agent
      );

      logger.info(`Product updated: ${updatedProduct.name} (${updatedProduct.code}) by ${updated_by}`);

      return updatedProduct;
    } catch (error) {
      logger.error('Error in updateProduct:', error);
      throw error;
    }
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(
    id: string,
    deleted_by: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<void> {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new NotFoundError('محصول یافت نشد');
    }

    // Soft delete
    await ProductModel.softDelete(id);

    // Log deletion
    await AuditLogModel.logDelete(
      deleted_by,
      EntityType.PRODUCT,
      id,
      product,
      ip_address,
      user_agent
    );

    logger.info(`Product deleted: ${product.name} (${product.code}) by ${deleted_by}`);
  }

  /**
   * Restore deleted product
   */
  async restoreProduct(id: string, restored_by: string): Promise<IProduct> {
    const product = await ProductModel.setActiveStatus(id, true);

    logger.info(`Product restored: ${product.name} (${product.code}) by ${restored_by}`);

    return product;
  }

  // ==========================================
  // STOCK MANAGEMENT
  // ==========================================

  /**
   * Update product stock
   */
  async updateStock(stockData: IStockUpdateData): Promise<IProduct> {
    try {
      const { product_id, quantity, type, reason, updated_by } = stockData;

      // Get product for audit
      const oldProduct = await ProductModel.findById(product_id);
      if (!oldProduct) {
        throw new NotFoundError('محصول یافت نشد');
      }

      // Update stock
      const updatedProduct = await ProductModel.adjustStock({
        product_id,
        quantity,
        type,
        reason,
        adjusted_by: updated_by,
      });

      // Log stock change
      await AuditLogModel.logUpdate(
        updated_by,
        EntityType.PRODUCT,
        product_id,
        { stock_quantity: oldProduct.stock_quantity },
        { stock_quantity: updatedProduct.stock_quantity },
        undefined,
        undefined
      );

      logger.info(
        `Stock updated for ${updatedProduct.name}: ${oldProduct.stock_quantity} -> ${updatedProduct.stock_quantity}`
      );

      return updatedProduct;
    } catch (error) {
      logger.error('Error in updateStock:', error);
      throw error;
    }
  }

  /**
   * Increase stock
   */
  async increaseStock(
    product_id: string,
    quantity: number,
    updated_by: string,
    reason?: string
  ): Promise<IProduct> {
    return this.updateStock({
      product_id,
      quantity,
      type: 'increase',
      reason: reason || 'افزایش موجودی',
      updated_by,
    });
  }

  /**
   * Decrease stock
   */
  async decreaseStock(
    product_id: string,
    quantity: number,
    updated_by: string,
    reason?: string
  ): Promise<IProduct> {
    return this.updateStock({
      product_id,
      quantity,
      type: 'decrease',
      reason: reason || 'کاهش موجودی',
      updated_by,
    });
  }

  /**
   * Set exact stock quantity
   */
  async setStock(
    product_id: string,
    quantity: number,
    updated_by: string,
    reason?: string
  ): Promise<IProduct> {
    return this.updateStock({
      product_id,
      quantity,
      type: 'set',
      reason: reason || 'تنظیم موجودی',
      updated_by,
    });
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<IProduct[]> {
    return ProductModel.findLowStock();
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(): Promise<IProduct[]> {
    return ProductModel.findOutOfStock();
  }

  /**
   * Check if product is low on stock
   */
  async isLowStock(product_id: string): Promise<boolean> {
    const product = await ProductModel.findById(product_id);
    if (!product) {
      throw new NotFoundError('محصول یافت نشد');
    }

    return product.stock_quantity <= product.min_stock_level;
  }

  // ==========================================
  // GOLD PRICE MANAGEMENT
  // ==========================================

  /**
   * Get current gold price for carat
   */
  async getCurrentGoldPrice(carat: number): Promise<number | null> {
    const result = await query(
      `SELECT price_per_gram 
       FROM gold_prices 
       WHERE carat = $1 
       ORDER BY date DESC 
       LIMIT 1`,
      [carat]
    );

    return result.rows[0]?.price_per_gram || null;
  }

  /**
   * Set gold price
   */
  async setGoldPrice(priceData: IGoldPriceData): Promise<void> {
    await query(
      `INSERT INTO gold_prices (carat, price_per_gram, date, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (carat, date) 
       DO UPDATE SET price_per_gram = $2, created_by = $4`,
      [
        priceData.carat,
        priceData.price_per_gram,
        priceData.date || new Date(),
        priceData.created_by,
      ]
    );

    logger.info(
      `Gold price updated: ${priceData.carat} carat = ${formatPrice(priceData.price_per_gram)}/gram`
    );
  }

  /**
   * Get gold price history
   */
  async getGoldPriceHistory(carat: number, days: number = 30) {
    const result = await query(
      `SELECT * FROM gold_prices 
       WHERE carat = $1 
       AND date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date DESC`,
      [carat]
    );

    return result.rows;
  }

  /**
   * Recalculate product prices based on current gold price
   */
  async recalculateProductPrices(
    category?: ProductCategory  ): Promise<number> {
    try {
      const filters: IProductFilter = { isActive: true };
      if (category) {
        filters.category = category;
      }

      const products = await ProductModel.findAll(filters);
      let updatedCount = 0;

      for (const product of products) {
        const goldPrice = await this.getCurrentGoldPrice(product.carat);
        if (goldPrice) {
          const newPrice = calculateGoldPrice(
            product.weight,
            product.carat,
            goldPrice,
            product.wage,
            product.stone_price
          );

          if (newPrice !== product.selling_price) {
            await ProductModel.update(product.id, {
              selling_price: newPrice,
            });
            updatedCount++;
          }
        }
      }

      logger.info(`Recalculated prices for ${updatedCount} products`);

      return updatedCount;
    } catch (error) {
      logger.error('Error in recalculateProductPrices:', error);
      throw error;
    }
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  /**
   * Bulk update prices
   */
  async bulkUpdatePrices(updateData: IBulkPriceUpdate): Promise<number> {
    try {
      const filters: IProductFilter = { isActive: true };
      if (updateData.category) {
        filters.category = updateData.category;
      }
      if (updateData.type) {
        filters.type = updateData.type;
      }

      const products = await ProductModel.findAll(filters);
      let updatedCount = 0;

      for (const product of products) {
        const newPrice = product.selling_price * (1 + updateData.percentage / 100);

        await ProductModel.update(product.id, {
          selling_price: Math.round(newPrice),
        });

        updatedCount++;
      }

      logger.info(
        `Bulk updated ${updatedCount} product prices by ${updateData.percentage}%`
      );

      return updatedCount;
    } catch (error) {
      logger.error('Error in bulkUpdatePrices:', error);
      throw error;
    }
  }

  /**
   * Bulk activate/deactivate products
   */
  async bulkSetActiveStatus(
    product_ids: string[],
    is_active: boolean,
    _updated_by: string
  ): Promise<number> {
    let updatedCount = 0;

    for (const id of product_ids) {
      try {
        await ProductModel.setActiveStatus(id, is_active);
        updatedCount++;
      } catch (error) {
        logger.error(`Error updating product ${id}:`, error);
      }
    }

    logger.info(`Bulk ${is_active ? 'activated' : 'deactivated'} ${updatedCount} products`);

    return updatedCount;
  }

  // ==========================================
  // SEARCH & FILTER
  // ==========================================

  /**
   * Search products
   */
  async searchProducts(searchTerm: string, limit: number = 10): Promise<IProduct[]> {
    return ProductModel.search(searchTerm, limit);
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: ProductCategory): Promise<IProduct[]> {
    return ProductModel.findByCategory(category);
  }

  /**
   * Get products by type
   */
  async getProductsByType(type: ProductType): Promise<IProduct[]> {
    return ProductModel.findByType(type);
  }

  /**
   * Advanced product search
   */
  async advancedSearch(filters: {
    search?: string;
    category?: ProductCategory;
    type?: ProductType;
    carat?: number;
    minWeight?: number;
    maxWeight?: number;
    minPrice?: number;
    maxPrice?: number;
    lowStock?: boolean;
    isActive?: boolean;
  }): Promise<IProduct[]> {
    return ProductModel.findAll(filters);
  }

  // ==========================================
  // REPORTS & STATISTICS
  // ==========================================

  /**
   * Get inventory report
   */
  async getInventoryReport(): Promise<IInventoryReport> {
    try {
      const stats = await ProductModel.getStatistics();
      const products = await ProductModel.findAll({ isActive: true });

      // Calculate by category
      const byCategory: Record<
        ProductCategory,
        { count: number; value: number; weight: number }
      > = {
        gold: { count: 0, value: 0, weight: 0 },
        silver: { count: 0, value: 0, weight: 0 },
        platinum: { count: 0, value: 0, weight: 0 },
        diamond: { count: 0, value: 0, weight: 0 },
        gemstone: { count: 0, value: 0, weight: 0 },
      };

      const byType: Record<ProductType, { count: number; value: number }> = {
        ring: { count: 0, value: 0 },
        necklace: { count: 0, value: 0 },
        bracelet: { count: 0, value: 0 },
        earring: { count: 0, value: 0 },
        anklet: { count: 0, value: 0 },
        bangle: { count: 0, value: 0 },
        chain: { count: 0, value: 0 },
        pendant: { count: 0, value: 0 },
        coin: { count: 0, value: 0 },
        bar: { count: 0, value: 0 },
        set: { count: 0, value: 0 },
        other: { count: 0, value: 0 },
      };

      products.forEach((product) => {
        const itemValue = product.selling_price * product.stock_quantity;
        const itemWeight = product.weight * product.stock_quantity;

        byCategory[product.category].count += product.stock_quantity;
        byCategory[product.category].value += itemValue;
        byCategory[product.category].weight += itemWeight;

        byType[product.type].count += product.stock_quantity;
        byType[product.type].value += itemValue;
      });

      // Top 10 products by value
      const topProducts = products
        .map((p) => ({
          id: p.id,
          name: p.name,
          value: p.selling_price * p.stock_quantity,
          stock: p.stock_quantity,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      return {
        totalProducts: stats.total,
        totalValue: stats.totalValue,
        totalWeight: stats.totalWeight,
        activeProducts: stats.active,
        lowStockProducts: stats.lowStock,
        outOfStockProducts: stats.outOfStock,
        byCategory,
        byType,
        topProducts,
      };
    } catch (error) {
      logger.error('Error in getInventoryReport:', error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   */
  async getStatistics() {
    return ProductModel.getStatistics();
  }

  /**
   * Get inventory value
   */
  async getTotalInventoryValue(): Promise<number> {
    return ProductModel.getTotalValue();
  }

  /**
   * Get total inventory weight
   */
  async getTotalInventoryWeight(): Promise<number> {
    return ProductModel.getTotalWeight();
  }

  /**
   * Get stock alerts
   */
  async getStockAlerts(): Promise<{
    lowStock: IProduct[];
    outOfStock: IProduct[];
    totalAlerts: number;
  }> {
    const [lowStock, outOfStock] = await Promise.all([
      ProductModel.findLowStock(),
      ProductModel.findOutOfStock(),
    ]);

    return {
      lowStock,
      outOfStock,
      totalAlerts: lowStock.length + outOfStock.length,
    };
  }

  /**
   * Get product performance
   */
  async getProductPerformance(product_id: string) {
    // This would typically join with sales data
    // For now, return basic product info
    const product = await ProductModel.findById(product_id);
    if (!product) {
      throw new NotFoundError('محصول یافت نشد');
    }

    return {
      product,
      // These would come from sales analytics
      totalSold: 0,
      revenue: 0,
      profit: 0,
    };
  }

  // ==========================================
  // IMAGE MANAGEMENT
  // ==========================================

  /**
   * Update product image
   */
  async updateProductImage(
    product_id: string,
    image_url: string,
    _updated_by: string
  ): Promise<IProduct> {
    const product = await ProductModel.updateImage(product_id, image_url);

    logger.info(`Product image updated: ${product.name} (${product.code})`);

    return product;
  }

  /**
   * Remove product image
   */
  async removeProductImage(product_id: string, updated_by: string): Promise<IProduct> {
    return this.updateProductImage(product_id, '', updated_by);
  }

  // ==========================================
  // VALIDATION
  // ==========================================

  /**
   * Validate product data
   */
  validateProductData(data: Partial<ICreateProduct>): void {
    if (data.weight !== undefined && data.weight <= 0) {
      throw new ValidationError('وزن باید مثبت باشد');
    }

    if (data.carat && ![18, 21, 22, 24].includes(data.carat)) {
      throw new ValidationError('عیار باید 18، 21، 22 یا 24 باشد');
    }

    if (data.stock_quantity !== undefined && data.stock_quantity < 0) {
      throw new ValidationError('موجودی نمی‌تواند منفی باشد');
    }

    if (data.selling_price !== undefined && data.selling_price <= 0) {
      throw new ValidationError('قیمت فروش باید مثبت باشد');
    }

    if (data.wage !== undefined && data.wage < 0) {
      throw new ValidationError('اجرت نمی‌تواند منفی باشد');
    }

    if (data.stone_price !== undefined && data.stone_price < 0) {
      throw new ValidationError('قیمت نگین نمی‌تواند منفی باشد');
    }
  }

  /**
   * Check if product code is unique
   */
  async isCodeUnique(code: string, excludeId?: string): Promise<boolean> {
    const product = await ProductModel.findByCode(code);
    if (!product) {
      return true;
    }
    if (excludeId && product.id === excludeId) {
      return true;
    }
    return false;
  }
}

// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================

export default new InventoryService();