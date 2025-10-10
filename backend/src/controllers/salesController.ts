// ==========================================
// ZARMIND - Sales Controller
// ==========================================

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import SalesService from '../services/salesService';
import { getCurrentUserId } from '../middleware/auth.middleware';
import {
  UnauthorizedError,
  ValidationError,
  ISale,
  ISaleWithItems,
  ISaleFilter,
  SaleStatus,
  SaleType,
  PaymentMethod,
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

const parseDate = (val: any, fieldName: string): Date | undefined => {
  if (!val) return undefined;
  const d = new Date(String(val));
  if (isNaN(d.getTime())) {
    throw new ValidationError(`تاریخ ${fieldName} نامعتبر است`);
  }
  return d;
};

const isEnumValue = <T extends string>(val: any, enumObj: Record<string, T>): val is T => {
  return Object.values(enumObj).includes(val as T);
};

// Build sale filters from query
const buildSaleFilters = (req: Request): ISaleFilter => {
  const {
    customer_id,
    status,
    sale_type,
    payment_method,
    startDate,
    endDate,
    search,
  } = req.query;

  let statusEnum: SaleStatus | undefined;
  let saleTypeEnum: SaleType | undefined;
  let paymentMethodEnum: PaymentMethod | undefined;

  if (status) {
    const s = String(status) as SaleStatus;
    if (!isEnumValue(s, SaleStatus)) {
      throw new ValidationError('وضعیت فروش نامعتبر است');
    }
    statusEnum = s;
  }

  if (sale_type) {
    const st = String(sale_type) as SaleType;
    if (!isEnumValue(st, SaleType)) {
      throw new ValidationError('نوع فروش نامعتبر است');
    }
    saleTypeEnum = st;
  }

  if (payment_method) {
    const pm = String(payment_method) as PaymentMethod;
    if (!isEnumValue(pm, PaymentMethod)) {
      throw new ValidationError('روش پرداخت نامعتبر است');
    }
    paymentMethodEnum = pm;
  }

  return {
    customer_id: customer_id ? String(customer_id) : undefined,
    status: statusEnum,
    sale_type: saleTypeEnum,
    payment_method: paymentMethodEnum,
    startDate: parseDate(startDate, 'شروع'),
    endDate: parseDate(endDate, 'پایان'),
    search: search ? String(search) : undefined,
  };
};

// ==========================================
// CONTROLLERS
// ==========================================

/**
 * Create sale
 * POST /api/sales
 */
export const createSale = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);

  const sale = await SalesService.createSale(
    { ...req.body },
    userId,
    req.ip,
    req.get('user-agent') || undefined
  );

  res.status(201).json({
    success: true,
    message: 'فروش با موفقیت ثبت شد',
    data: sale,
  });
});

/**
 * Get sale by ID
 * GET /api/sales/:id
 */
export const getSale = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);
  const sale = await SalesService.getSaleById(
    req.params.id,
    userId,
    req.ip,
    req.get('user-agent') || undefined
  );
  res.sendSuccess(sale, 'اطلاعات فروش با موفقیت دریافت شد');
});

/**
 * Get sale by sale number
 * GET /api/sales/number/:sale_number
 */
export const getSaleByNumber = asyncHandler(async (req: Request, res: Response) => {
  const sale = await SalesService.getSaleBySaleNumber(req.params.sale_number);
  res.sendSuccess(sale, 'اطلاعات فروش با موفقیت دریافت شد');
});

/**
 * Get sales (with optional pagination + filters)
 * GET /api/sales
 * Query: page, limit, customer_id, status, sale_type, payment_method, startDate, endDate, search
 */
export const getSales = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

  const filters = buildSaleFilters(req);

  if (page && limit) {
    const result = await SalesService.getSalesWithPagination(page, limit, filters);
    res.sendSuccess(result, 'لیست فروش‌ها (صفحه‌بندی) دریافت شد', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    });
  } else {
    const sales = await SalesService.getSales(filters);
    res.sendSuccess(sales, 'لیست فروش‌ها دریافت شد', { total: sales.length });
  }
});

/**
 * Update sale
 * PUT /api/sales/:id
 */
export const updateSale = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);

  const updated = await SalesService.updateSale(
    req.params.id,
    { ...req.body },
    userId,
    req.ip,
    req.get('user-agent') || undefined
  );

  res.sendSuccess(updated, 'فروش با موفقیت بروزرسانی شد');
});

/**
 * Update sale status
 * PATCH /api/sales/:id/status
 * Body: { status: 'draft'|'completed'|'partial'|'cancelled'|'returned' }
 */
export const updateSaleStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const status = String(req.body.status) as SaleStatus;

  if (!isEnumValue(status, SaleStatus)) {
    throw new ValidationError('وضعیت فروش نامعتبر است');
  }

  const updated = await SalesService.updateSaleStatus(req.params.id, status, userId);
  res.sendSuccess(updated, 'وضعیت فروش بروزرسانی شد');
});

/**
 * Cancel sale
 * POST /api/sales/:id/cancel
 * Body: { reason?: string }
 */
export const cancelSale = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const reason = req.body.reason ? String(req.body.reason) : undefined;

  const cancelled = await SalesService.cancelSale(
    req.params.id,
    userId,
    reason,
    req.ip,
    req.get('user-agent') || undefined
  );

  res.sendSuccess(cancelled, 'فروش با موفقیت لغو شد');
});

/**
 * Delete sale (draft only)
 * DELETE /api/sales/:id
 */
export const deleteSale = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);

  await SalesService.deleteSale(
    req.params.id,
    userId,
    req.ip,
    req.get('user-agent') || undefined
  );

  res.sendSuccess(null, 'فروش با موفقیت حذف شد');
});

/**
 * Add payment to sale
 * POST /api/sales/:id/payments
 * Body: { amount: number, payment_method: PaymentMethod, reference_number?: string, notes?: string }
 */
export const addPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);

  const amount = Number(req.body.amount);
  const payment_method = String(req.body.payment_method) as PaymentMethod;
  const reference_number = req.body.reference_number ? String(req.body.reference_number) : undefined;

  if (isNaN(amount) || amount <= 0) {
    throw new ValidationError('مبلغ پرداخت باید عددی و مثبت باشد');
  }
  if (!isEnumValue(payment_method, PaymentMethod)) {
    throw new ValidationError('روش پرداخت نامعتبر است');
  }

  const updated = await SalesService.addPayment({
    sale_id: req.params.id,
    amount,
    payment_method,
    reference_number,
    notes: req.body.notes ? String(req.body.notes) : undefined,
    processed_by: userId,
  });

  res.sendSuccess(updated, 'پرداخت با موفقیت ثبت شد');
});

/**
 * Get sales by customer
 * GET /api/sales/customer/:customer_id
 */
export const getSalesByCustomer = asyncHandler(async (req: Request, res: Response) => {
  const list = await SalesService.getSalesByCustomer(req.params.customer_id);
  res.sendSuccess(list, 'لیست فروش‌های مشتری دریافت شد', { total: list.length });
});

/**
 * Pending payments
 * GET /api/sales/pending-payments
 */
export const getPendingPayments = asyncHandler(async (_req: Request, res: Response) => {
  const list = await SalesService.getPendingPayments();
  res.sendSuccess(list, 'لیست پرداخت‌های معوق دریافت شد', { total: list.length });
});

/**
 * Overdue payments
 * GET /api/sales/overdue-payments?days=30
 */
export const getOverduePayments = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
  const list = await SalesService.getOverduePayments(days);
  res.sendSuccess(list, 'لیست پرداخت‌های سررسید گذشته دریافت شد', { total: list.length });
});

// ==========================================
// REPORTS & ANALYTICS
// ==========================================

/**
 * Sales report
 * GET /api/sales/report?startDate=...&endDate=...
 */
export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const start = parseDate(req.query.startDate, 'شروع');
  const end = parseDate(req.query.endDate, 'پایان');

  const report = await SalesService.getSalesReport(start, end);  // ✅ FIXED

  res.sendSuccess(report, 'گزارش فروش دریافت شد');
});

/**
 * Sales performance (today/week/month/year)
 * GET /api/sales/performance
 */
export const getPerformance = asyncHandler(async (_req: Request, res: Response) => {
  const data = await SalesService.getSalesPerformance();
  res.sendSuccess(data, 'عملکرد فروش دریافت شد');
});

/**
 * Today sales
 * GET /api/sales/today
 */
export const getTodaySales = asyncHandler(async (_req: Request, res: Response) => {
  const list = await SalesService.getTodaySales();
  res.sendSuccess(list, 'فروش‌های امروز دریافت شد', { total: list.length });
});

/**
 * Today revenue
 * GET /api/sales/today/revenue
 */
export const getTodayRevenue = asyncHandler(async (_req: Request, res: Response) => {
  const total = await SalesService.getTodayRevenue();
  res.sendSuccess({ total }, 'درآمد امروز دریافت شد');
});

/**
 * Recent sales
 * GET /api/sales/recent?limit=10
 */
export const getRecentSales = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
  const list = await SalesService.getRecentSales(limit);
  res.sendSuccess(list, 'آخرین فروش‌ها دریافت شد', { total: list.length });
});

/**
 * Sales statistics (aggregate)
 * GET /api/sales/statistics?startDate=...&endDate=...
 */
export const getStatistics = asyncHandler(async (req: Request, res: Response) => {
  const start = parseDate(req.query.startDate, 'شروع');
  const end = parseDate(req.query.endDate, 'پایان');

  const stats = await SalesService.getStatistics(start, end);
  res.sendSuccess(stats, 'آمار فروش دریافت شد');
});

/**
 * Sales by date range
 * GET /api/sales/range?startDate=...&endDate=...
 */
export const getSalesByDateRange = asyncHandler(async (req: Request, res: Response) => {
  const start = parseDate(req.query.startDate, 'شروع');
  const end = parseDate(req.query.endDate, 'پایان');

  if (!start || !end) {
    throw new ValidationError('محدوده تاریخ الزامی است');
  }

  const list = await SalesService.getSalesByDateRange(start, end);
  res.sendSuccess(list, 'فروش‌های بازه زمانی دریافت شد', { total: list.length });
});

/**
 * Best selling products
 * GET /api/sales/best-products?limit=10&startDate=...&endDate=...
 */
export const getBestSellingProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
  const start = parseDate(req.query.startDate, 'شروع');
  const end = parseDate(req.query.endDate, 'پایان');

  const list = await SalesService.getBestSellingProducts(limit, start, end);
  res.sendSuccess(list, 'پرفروش‌ترین محصولات دریافت شد', { total: list.length });
});

/**
 * Sales trend
 * GET /api/sales/trend?period=daily|weekly|monthly&days=30
 */
export const getSalesTrend = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period ? String(req.query.period) : 'daily') as
    | 'daily'
    | 'weekly'
    | 'monthly';
  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    throw new ValidationError('دوره نامعتبر است (daily | weekly | monthly)');
  }

  const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;

  const list = await SalesService.getSalesTrend(period, days);
  res.sendSuccess(list, 'روند فروش دریافت شد');
});

/**
 * Conversion rate (drafts to completed)
 * GET /api/sales/conversion?startDate=...&endDate=...
 */
export const getConversionRate = asyncHandler(async (req: Request, res: Response) => {
  const start = parseDate(req.query.startDate, 'شروع');
  const end = parseDate(req.query.endDate, 'پایان');

  const result = await SalesService.getConversionRate(start, end);
  res.sendSuccess(result, 'نرخ تبدیل فروش دریافت شد');
});

// ==========================================
// INVOICE & RECEIPT
// ==========================================

/**
 * Generate invoice
 * GET /api/sales/:id/invoice
 */
export const generateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const data = await SalesService.generateInvoice(req.params.id);
  res.sendSuccess(data, 'اطلاعات فاکتور دریافت شد');
});

/**
 * Generate receipt by transaction id
 * GET /api/sales/receipt/:transaction_id
 */
export const generateReceipt = asyncHandler(async (req: Request, res: Response) => {
  const data = await SalesService.generateReceipt(req.params.transaction_id);
  res.sendSuccess(data, 'اطلاعات رسید دریافت شد');
});

// ==========================================
// EXPORTS
// ==========================================

export default {
  // CRUD
  createSale,
  getSale,
  getSaleByNumber,
  getSales,
  updateSale,
  updateSaleStatus,
  cancelSale,
  deleteSale,

  // Payments
  addPayment,
  getPendingPayments,
  getOverduePayments,
  getSalesByCustomer,

  // Reports & Analytics
  getSalesReport,
  getPerformance,
  getTodaySales,
  getTodayRevenue,
  getRecentSales,
  getStatistics,
  getSalesByDateRange,
  getBestSellingProducts,
  getSalesTrend,
  getConversionRate,

  // Invoice & Receipt
  generateInvoice,
  generateReceipt,
};