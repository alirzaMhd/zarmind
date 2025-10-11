// ==========================================
// ZARMIND - Inventory Controller
// ==========================================

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import InventoryService from '../services/inventoryService';
import { getCurrentUserId } from '../middleware/auth.middleware';
import {
  UnauthorizedError,
  ValidationError,
  ProductCategory,
  ProductType,
  IProductFilter,
} from '../types';

// ==========================================
// HELPERS
// ==========================================

const requireUser = (req: Request): string => {
  const userId = getCurrentUserId(req);
  if (!userId) throw new UnauthorizedError('کاربر احراز هویت نشده است');
  return userId;
};

const parseBoolean = (val: any): boolean | undefined => {
  if (val === undefined) return undefined;
  if (typeof val === 'boolean') return val;
  const v = String(val).toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(v)) return true;
  if (['false', '0', 'no', 'n'].includes(v)) return false;
  return undefined;
};

// Build product filters from query
const buildProductFilters = (req: Request): IProductFilter => {
  const {
    category,
    type,
    carat,
    minWeight,
    maxWeight,
    minPrice,
    maxPrice,
    search,
    isActive,
    lowStock,
  } = req.query;

  return {
    category: category as ProductCategory | undefined,
    type: type as ProductType | undefined,
    carat: carat ? parseInt(String(carat), 10) : undefined,
    minWeight: minWeight ? parseFloat(String(minWeight)) : undefined,
    maxWeight: maxWeight ? parseFloat(String(maxWeight)) : undefined,
    minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
    maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
    search: search ? String(search) : undefined,
    isActive: isActive !== undefined ? parseBoolean(isActive) : undefined,
    lowStock: lowStock !== undefined ? parseBoolean(lowStock) : undefined,
  };
};

// ==========================================
// CONTROLLERS
// ==========================================

/**
 * Create product
 * POST /api/inventory
 */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);

  const product = await InventoryService.createProduct(
    { ...req.body },
    userId,
    req.ip,
    req.get('user-agent') || undefined
  );

  res.status(201).json({
    success: true,
    message: 'محصول با موفقیت ثبت شد',
    data: product,
  });
});

/**
 * Get product by ID
 * GET /api/inventory/:id
 */
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);
  const customerId = req.params.id;
  
  if (!customerId) {
    throw new ValidationError('شناسه مشتری الزامی است');
  }
  const product = await InventoryService.getProductById(
    customerId,
    userId,
    req.ip,
    req.get('user-agent') || undefined
  );
  res.sendSuccess(product, 'محصول با موفقیت دریافت شد');
});

/**
 * Get product by ID with current gold price info
 * GET /api/inventory/:id/price
 */
export const getProductWithPrice = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.params.id;
  
  if (!customerId) {
    throw new ValidationError('شناسه مشتری الزامی است');
  }
  const product = await InventoryService.getProductByIdWithPrice(customerId);
  res.sendSuccess(product, 'محصول و قیمت به‌روز با موفقیت دریافت شد');
});

/**
 * Get products (with optional pagination and filters)
 * GET /api/inventory
 * Query: page, limit, filters...
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

  const filters = buildProductFilters(req);

  if (page && limit) {
    const result = await InventoryService.getProductsWithPagination(page, limit, filters);
    res.sendSuccess(result, 'لیست محصولات (صفحه‌بندی شده) دریافت شد', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    });
  } else {
    const products = await InventoryService.getProducts(filters);
    res.sendSuccess(products, 'لیست محصولات دریافت شد', { total: products.length });
  }
});

/**
 * Update product
 * PUT /api/inventory/:id
 */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const customerId = req.params.id;
  
  if (!customerId) {
    throw new ValidationError('شناسه مشتری الزامی است');
  }

  const updated = await InventoryService.updateProduct(
    customerId,
    { ...req.body },
    userId,
    req.ip,
    req.get('user-agent') || undefined
  );

  res.sendSuccess(updated, 'محصول با موفقیت بروزرسانی شد');
});

/**
 * Delete (soft) product
 * DELETE /api/inventory/:id
 */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const customerId = req.params.id;
  
  if (!customerId) {
    throw new ValidationError('شناسه مشتری الزامی است');
  }
  await InventoryService.deleteProduct(
    customerId,
    userId,
    req.ip,
    req.get('user-agent') || undefined
  );
  res.sendSuccess(null, 'محصول با موفقیت حذف شد');
});

/**
 * Restore product (activate)
 * PATCH /api/inventory/:id/restore
 */
export const restoreProduct = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const customerId = req.params.id;
  
  if (!customerId) {
    throw new ValidationError('شناسه مشتری الزامی است');
  }
  const restored = await InventoryService.restoreProduct(customerId, userId);
  res.sendSuccess(restored, 'محصول با موفقیت بازیابی شد');
});

/**
 * Update stock (increase/decrease/set)
 * PATCH /api/inventory/:id/stock
 * Body: { type: 'increase'|'decrease'|'set', quantity: number, reason?: string }
 */
export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const { type, quantity, reason } = req.body;

  if (!type || !['increase', 'decrease', 'set'].includes(type)) {
    throw new ValidationError('نوع تغییر موجودی نامعتبر است');
  }
  if (quantity === undefined || quantity === null || isNaN(Number(quantity))) {
    throw new ValidationError('مقدار موجودی نامعتبر است');
  }
  if (['increase', 'decrease'].includes(type) && Number(quantity) <= 0) {
    throw new ValidationError('مقدار باید بزرگ‌تر از صفر باشد');
  }
  if (type === 'set' && Number(quantity) < 0) {
    throw new ValidationError('مقدار موجودی نمی‌تواند منفی باشد');
  }
  const customerId = req.params.id;
  
  if (!customerId) {
    throw new ValidationError('شناسه مشتری الزامی است');
  }

  const updated = await InventoryService.updateStock({
    product_id: customerId,
    quantity: Number(quantity),
    type,
    reason,
    updated_by: userId,
  });

  res.sendSuccess(updated, 'موجودی محصول با موفقیت بروزرسانی شد');
});

/**
 * Increase stock
 * PATCH /api/inventory/:id/stock/increase
 * Body: { quantity: number, reason?: string }
 */
export const increaseStock = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const qty = Number(req.body.quantity);
  if (!qty || qty <= 0) throw new ValidationError('مقدار افزایش باید مثبت باشد');
  const customerId = req.params.id;
  
  if (!customerId) {
    throw new ValidationError('شناسه مشتری الزامی است');
  }

  const updated = await InventoryService.increaseStock(
    customerId,
    qty,
    userId,
    req.body.reason
  );
  res.sendSuccess(updated, 'موجودی محصول افزایش یافت');
});

/**
 * Decrease stock
 * PATCH /api/inventory/:id/stock/decrease
 * Body: { quantity: number, reason?: string }
 */
export const decreaseStock = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const qty = Number(req.body.quantity);
  if (!qty || qty <= 0) throw new ValidationError('مقدار کاهش باید مثبت باشد');
  const customerId = req.params.id;
  
  if (!customerId) {
    throw new ValidationError('شناسه مشتری الزامی است');
  }

  const updated = await InventoryService.decreaseStock(
    customerId,
    qty,
    userId,
    req.body.reason
  );
  res.sendSuccess(updated, 'موجودی محصول کاهش یافت');
});

/**
 * Set exact stock
 * PATCH /api/inventory/:id/stock/set
 * Body: { quantity: number, reason?: string }
 */
export const setStock = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const qty = Number(req.body.quantity);
  if (qty === undefined || qty === null || isNaN(qty) || qty < 0) {
    throw new ValidationError('مقدار موجودی نامعتبر است');
  }
  const customerId = req.params.id;
  
  if (!customerId) {
    throw new ValidationError('شناسه مشتری الزامی است');
  }

  const updated = await InventoryService.setStock(
    customerId,
    qty,
    userId,
    req.body.reason
  );
  res.sendSuccess(updated, 'موجودی محصول تنظیم شد');
});

/**
 * Update product image
 * PUT /api/inventory/:id/image
 * Accepts multipart (req.file) or JSON body { image_url }
 */
export const updateImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const customerId = req.params.id;
  
  if (!customerId) {
    throw new ValidationError('شناسه مشتری الزامی است');
  }

  const imageUrl = (req.file && (req.file as any).path) || req.body.image_url;
  if (!imageUrl) {
    throw new ValidationError('فایل یا آدرس تصویر الزامی است');
  }

  const updated = await InventoryService.updateProductImage(customerId, imageUrl, userId);
  res.sendSuccess(updated, 'تصویر محصول با موفقیت بروزرسانی شد');
});

/**
 * Remove product image
 * DELETE /api/inventory/:id/image
 */
export const removeImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const customerId = req.params.id;
  
  if (!customerId) {
    throw new ValidationError('شناسه مشتری الزامی است');
  }
  const updated = await InventoryService.removeProductImage(customerId, userId);
  res.sendSuccess(updated, 'تصویر محصول حذف شد');
});

/**
 * Low stock products
 * GET /api/inventory/low-stock
 */
export const getLowStock = asyncHandler(async (_req: Request, res: Response) => {
  const items = await InventoryService.getLowStockProducts();
  res.sendSuccess(items, 'لیست محصولات با موجودی کم دریافت شد', { total: items.length });
});

/**
 * Out of stock products
 * GET /api/inventory/out-of-stock
 */
export const getOutOfStock = asyncHandler(async (_req: Request, res: Response) => {
  const items = await InventoryService.getOutOfStockProducts();
  res.sendSuccess(items, 'لیست محصولات ناموجود دریافت شد', { total: items.length });
});

/**
 * Search products
 * GET /api/inventory/search?query=...
 */
export const search = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.query || req.query.q || '');
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
  const items = await InventoryService.searchProducts(q, limit);
  res.sendSuccess(items, 'نتایج جستجو دریافت شد', { total: items.length });
});

/**
 * Advanced search
 * GET /api/inventory/advanced?...
 */
export const advancedSearch = asyncHandler(async (req: Request, res: Response) => {
  const filters = buildProductFilters(req);
  const items = await InventoryService.advancedSearch(filters);
  res.sendSuccess(items, 'نتایج جستجوی پیشرفته دریافت شد', { total: items.length });
});

/**
 * Recalculate prices based on current gold price
 * POST /api/inventory/recalculate-prices
 * Body: { category?: ProductCategory }
 */
export const recalculatePrices = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.body;
  const updatedCount = await InventoryService.recalculateProductPrices(category);
  res.sendSuccess({ updatedCount }, 'قیمت محصولات بر اساس قیمت طلا بروزرسانی شد');
});

/**
 * Bulk update prices (percentage)
 * POST /api/inventory/bulk/price-update
 * Body: { percentage: number, category?: ProductCategory, type?: ProductType }
 */
export const bulkUpdatePrices = asyncHandler(async (req: Request, res: Response) => {
  const percentage = Number(req.body.percentage);
  if (!percentage) {
    throw new ValidationError('درصد تغییر قیمت الزامی است');
  }

  const updatedCount = await InventoryService.bulkUpdatePrices({
    percentage,
    category: req.body.category,
    type: req.body.type,
    updated_by: requireUser(req),
  });

  res.sendSuccess({ updatedCount }, 'قیمت‌ها به صورت گروهی بروزرسانی شدند');
});

/**
 * Bulk set active status
 * POST /api/inventory/bulk/active
 * Body: { product_ids: string[], is_active: boolean }
 */
export const bulkSetActive = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const ids: string[] = req.body.product_ids || [];
  const isActive = parseBoolean(req.body.is_active);

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError('لیست شناسه محصولات الزامی است');
  }
  if (isActive === undefined) {
    throw new ValidationError('وضعیت فعال/غیرفعال نامعتبر است');
  }

  const updatedCount = await InventoryService.bulkSetActiveStatus(ids, isActive, userId);
  res.sendSuccess({ updatedCount }, 'وضعیت محصولات به‌روزرسانی شد');
});

/**
 * Get current gold price
 * GET /api/inventory/gold-price/current?carat=18
 */
export const getCurrentGoldPrice = asyncHandler(async (req: Request, res: Response) => {
  const carat = req.query.carat ? parseInt(String(req.query.carat), 10) : undefined;
  if (!carat) throw new ValidationError('عیار الزامی است');

  const price = await InventoryService.getCurrentGoldPrice(carat);
  res.sendSuccess({ carat, price }, 'قیمت به‌روز طلا دریافت شد');
});

/**
 * Set gold price
 * POST /api/inventory/gold-price
 * Body: { carat: number, price_per_gram: number, date?: string }
 */
export const setGoldPrice = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const carat = parseInt(String(req.body.carat), 10);
  const ppg = parseFloat(String(req.body.price_per_gram));
  const date = req.body.date ? new Date(req.body.date) : undefined;

  if (![18, 21, 22, 24].includes(carat)) {
    throw new ValidationError('عیار باید 18، 21، 22 یا 24 باشد');
  }
  if (!ppg || ppg <= 0) {
    throw new ValidationError('قیمت هر گرم نامعتبر است');
  }

  await InventoryService.setGoldPrice({
    carat,
    price_per_gram: ppg,
    date,
    created_by: userId,
  });

  res.sendSuccess(null, 'قیمت طلا ثبت شد');
});

/**
 * Gold price history
 * GET /api/inventory/gold-price/history?carat=18&days=30
 */
export const getGoldPriceHistory = asyncHandler(async (req: Request, res: Response) => {
  const carat = req.query.carat ? parseInt(String(req.query.carat), 10) : undefined;
  const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;

  if (!carat) throw new ValidationError('عیار الزامی است');

  const history = await InventoryService.getGoldPriceHistory(carat, days);
  res.sendSuccess(history, 'تاریخچه قیمت طلا دریافت شد');
});

/**
 * Inventory report
 * GET /api/inventory/report
 */
export const getInventoryReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = await InventoryService.getInventoryReport();
  res.sendSuccess(report, 'گزارش موجودی دریافت شد');
});

/**
 * Inventory statistics
 * GET /api/inventory/statistics
 */
export const getStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await InventoryService.getStatistics();
  res.sendSuccess(stats, 'آمار موجودی دریافت شد');
});

/**
 * Stock alerts
 * GET /api/inventory/alerts
 */
export const getStockAlerts = asyncHandler(async (_req: Request, res: Response) => {
  const alerts = await InventoryService.getStockAlerts();
  res.sendSuccess(alerts, 'هشدارهای موجودی دریافت شد', { total: alerts.totalAlerts });
});

/**
 * Product performance
 * GET /api/inventory/:id/performance
 */
export const getProductPerformance = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.params.id;
  
  if (!customerId) {
    throw new ValidationError('شناسه مشتری الزامی است');
  }
  const perf = await InventoryService.getProductPerformance(customerId);
  res.sendSuccess(perf, 'عملکرد محصول دریافت شد');
});

// ==========================================
// EXPORTS
// ==========================================

export default {
  // CRUD
  createProduct,
  getProduct,
  getProductWithPrice,
  getProducts,
  updateProduct,
  deleteProduct,
  restoreProduct,

  // Stock
  updateStock,
  increaseStock,
  decreaseStock,
  setStock,

  // Images
  updateImage,
  removeImage,

  // Lists
  getLowStock,
  getOutOfStock,
  search,
  advancedSearch,

  // Prices
  recalculatePrices,
  bulkUpdatePrices,
  bulkSetActive,

  // Gold Price
  getCurrentGoldPrice,
  setGoldPrice,
  getGoldPriceHistory,

  // Reports
  getInventoryReport,
  getStatistics,
  getStockAlerts,
  getProductPerformance,
};