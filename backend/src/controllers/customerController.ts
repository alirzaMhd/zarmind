// ==========================================
// ZARMIND - Customer Controller
// ==========================================

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import CustomerService from '../services/customerService';
import { getCurrentUserId } from '../middleware/auth.middleware';
import {
  UnauthorizedError,
  ValidationError,
  ICustomerFilter,
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

// Build customer filters from query
const buildCustomerFilters = (req: Request): ICustomerFilter => {
  const { search, city, hasDebt, hasCredit, isActive } = req.query;

  return {
    search: search ? String(search) : undefined,
    city: city ? String(city) : undefined,
    hasDebt: hasDebt !== undefined ? parseBoolean(hasDebt) : undefined,
    hasCredit: hasCredit !== undefined ? parseBoolean(hasCredit) : undefined,
    isActive: isActive !== undefined ? parseBoolean(isActive) : undefined,
  };
};

// ==========================================
// CONTROLLERS
// ==========================================

/**
 * Create customer
 * POST /api/customers
 */
export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);

  const customer = await CustomerService.createCustomer(
    { ...req.body },
    userId,
    req.ip,
    req.get('user-agent') || undefined
  );

  res.status(201).json({
    success: true,
    message: 'مشتری با موفقیت ثبت شد',
    data: customer,
  });
});

/**
 * Get customer by ID
 * GET /api/customers/:id
 */
export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);
  const customer = await CustomerService.getCustomerById(
    req.params.id,
    userId,
    req.ip,
    req.get('user-agent') || undefined
  );
  res.sendSuccess(customer, 'اطلاعات مشتری با موفقیت دریافت شد');
});

/**
 * Get customers (with optional pagination)
 * GET /api/customers
 * Query: page, limit, filters...
 */
export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

  const filters = buildCustomerFilters(req);

  if (page && limit) {
    const result = await CustomerService.getCustomersWithPagination(page, limit, filters);
    res.sendSuccess(result, 'لیست مشتریان (صفحه‌بندی) دریافت شد', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    });
  } else {
    const customers = await CustomerService.getCustomers(filters);
    res.sendSuccess(customers, 'لیست مشتریان دریافت شد', { total: customers.length });
  }
});

/**
 * Update customer
 * PUT /api/customers/:id
 */
export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);

  const updated = await CustomerService.updateCustomer(
    req.params.id,
    { ...req.body },
    userId,
    req.ip,
    req.get('user-agent') || undefined
  );

  res.sendSuccess(updated, 'مشتری با موفقیت بروزرسانی شد');
});

/**
 * Delete (soft) customer
 * DELETE /api/customers/:id
 */
export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  await CustomerService.deleteCustomer(
    req.params.id,
    userId,
    req.ip,
    req.get('user-agent') || undefined
  );
  res.sendSuccess(null, 'مشتری با موفقیت حذف شد');
});

/**
 * Restore customer (activate)
 * PATCH /api/customers/:id/restore
 */
export const restoreCustomer = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const restored = await CustomerService.restoreCustomer(req.params.id, userId);
  res.sendSuccess(restored, 'مشتری با موفقیت بازیابی شد');
});

/**
 * Adjust balance
 * PATCH /api/customers/:id/balance
 * Body: { type: 'increase'|'decrease'|'set', amount: number, reason: string }
 */
export const adjustBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const { type, amount, reason } = req.body;

  if (!['increase', 'decrease', 'set'].includes(type)) {
    throw new ValidationError('نوع تغییر موجودی نامعتبر است');
  }
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    throw new ValidationError('مبلغ نامعتبر است');
  }
  if (!reason || String(reason).trim().length === 0) {
    throw new ValidationError('دلیل تغییر مانده الزامی است');
  }

  const updated = await CustomerService.adjustBalance({
    customer_id: req.params.id,
    amount: Number(amount),
    type,
    reason,
    adjusted_by: userId,
  });

  res.sendSuccess(updated, 'مانده حساب مشتری با موفقیت بروزرسانی شد');
});

/**
 * Add debt
 * PATCH /api/customers/:id/debt/add
 * Body: { amount: number, reason?: string }
 */
export const addDebt = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) throw new ValidationError('مبلغ باید مثبت باشد');

  const updated = await CustomerService.addDebt(
    req.params.id,
    amount,
    userId,
    req.body.reason
  );
  res.sendSuccess(updated, 'بدهی مشتری افزایش یافت');
});

/**
 * Reduce debt
 * PATCH /api/customers/:id/debt/reduce
 * Body: { amount: number, reason?: string }
 */
export const reduceDebt = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) throw new ValidationError('مبلغ باید مثبت باشد');

  const updated = await CustomerService.reduceDebt(
    req.params.id,
    amount,
    userId,
    req.body.reason
  );
  res.sendSuccess(updated, 'بدهی مشتری کاهش یافت');
});

/**
 * Settle account
 * PATCH /api/customers/:id/settle
 */
export const settleAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const updated = await CustomerService.settleAccount(req.params.id, userId);
  res.sendSuccess(updated, 'حساب مشتری تسویه شد');
});

/**
 * Update credit limit
 * PATCH /api/customers/:id/credit-limit
 * Body: { credit_limit: number }
 */
export const updateCreditLimit = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const credit_limit = Number(req.body.credit_limit);
  if (isNaN(credit_limit)) throw new ValidationError('سقف اعتبار نامعتبر است');

  const updated = await CustomerService.updateCreditLimit(req.params.id, credit_limit, userId);
  res.sendSuccess(updated, 'سقف اعتبار مشتری بروزرسانی شد');
});

/**
 * Get debtors
 * GET /api/customers/debtors
 */
export const getDebtors = asyncHandler(async (_req: Request, res: Response) => {
  const items = await CustomerService.getCustomersWithDebt();
  res.sendSuccess(items, 'لیست مشتریان بدهکار دریافت شد', { total: items.length });
});

/**
 * Get creditors
 * GET /api/customers/creditors
 */
export const getCreditors = asyncHandler(async (_req: Request, res: Response) => {
  const items = await CustomerService.getCustomersWithCredit();
  res.sendSuccess(items, 'لیست مشتریان طلبکار دریافت شد', { total: items.length });
});

/**
 * Search customers
 * GET /api/customers/search?q=...&limit=10
 */
export const search = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.query || req.query.q || '');
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
  const items = await CustomerService.searchCustomers(q, limit);
  res.sendSuccess(items, 'نتایج جستجو دریافت شد', { total: items.length });
});

/**
 * Advanced search
 * GET /api/customers/advanced?...
 */
export const advancedSearch = asyncHandler(async (req: Request, res: Response) => {
  const filters = buildCustomerFilters(req);
  const items = await CustomerService.advancedSearch(filters);
  res.sendSuccess(items, 'نتایج جستجوی پیشرفته دریافت شد', { total: items.length });
});

/**
 * Customer account summary
 * GET /api/customers/:id/account
 */
export const getAccountSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await CustomerService.getCustomerAccountSummary(req.params.id);
  res.sendSuccess(summary, 'خلاصه حساب مشتری دریافت شد');
});

/**
 * Purchase history
 * GET /api/customers/:id/purchase-history
 */
export const getPurchaseHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await CustomerService.getCustomerPurchaseHistory(req.params.id);
  res.sendSuccess(history, 'تاریخچه خرید مشتری دریافت شد');
});

/**
 * Transactions history
 * GET /api/customers/:id/transactions
 */
export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const txns = await CustomerService.getCustomerTransactions(req.params.id);
  res.sendSuccess(txns, 'تاریخچه تراکنش‌های مشتری دریافت شد');
});

/**
 * Customer statistics
 * GET /api/customers/statistics
 */
export const getStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await CustomerService.getCustomerStatistics();
  res.sendSuccess(stats, 'آمار مشتریان دریافت شد');
});

/**
 * Top customers
 * GET /api/customers/top?limit=10
 */
export const getTopCustomers = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
  const list = await CustomerService.getTopCustomers(limit);
  res.sendSuccess(list, 'مشتریان برتر دریافت شد', { total: list.length });
});

/**
 * Debtor report
 * GET /api/customers/debtor-report
 */
export const getDebtorReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = await CustomerService.getDebtorReport();
  res.sendSuccess(report, 'گزارش بدهکاران دریافت شد', { total: report.length });
});

/**
 * Customers near credit limit
 * GET /api/customers/near-credit-limit?threshold=80
 */
export const getCustomersNearingCreditLimit = asyncHandler(async (req: Request, res: Response) => {
  const threshold = req.query.threshold ? parseInt(String(req.query.threshold), 10) : 80;
  const items = await CustomerService.getCustomersNearingCreditLimit(threshold);
  res.sendSuccess(items, 'مشتریان نزدیک به سقف اعتبار دریافت شد', { total: items.length });
});

/**
 * Lifetime value
 * GET /api/customers/:id/lifetime-value
 */
export const getLifetimeValue = asyncHandler(async (req: Request, res: Response) => {
  const value = await CustomerService.getCustomerLifetimeValue(req.params.id);
  res.sendSuccess(value, 'ارزش طول عمر مشتری دریافت شد');
});

/**
 * New customers (this month)
 * GET /api/customers/new
 */
export const getNewCustomers = asyncHandler(async (_req: Request, res: Response) => {
  const list = await CustomerService.getNewCustomers();
  res.sendSuccess(list, 'مشتریان جدید دریافت شد', { total: list.length });
});

/**
 * Inactive customers
 * GET /api/customers/inactive?days=90
 */
export const getInactiveCustomers = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(String(req.query.days), 10) : 90;
  const list = await CustomerService.getInactiveCustomers(days);
  res.sendSuccess(list, 'مشتریان غیرفعال دریافت شد', { total: list.length });
});

/**
 * Bulk set active status
 * POST /api/customers/bulk/active
 * Body: { customer_ids: string[], is_active: boolean }
 */
export const bulkSetActive = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const ids: string[] = req.body.customer_ids || [];
  const isActive = parseBoolean(req.body.is_active);

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError('لیست شناسه مشتریان الزامی است');
  }
  if (isActive === undefined) {
    throw new ValidationError('وضعیت فعال/غیرفعال نامعتبر است');
  }

  const updatedCount = await CustomerService.bulkSetActiveStatus(ids, isActive, userId);
  res.sendSuccess({ updatedCount }, 'وضعیت مشتریان به‌روزرسانی شد');
});

/**
 * Bulk update credit limit
 * POST /api/customers/bulk/credit-limit
 * Body: { customer_ids: string[], credit_limit: number }
 */
export const bulkUpdateCreditLimit = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const ids: string[] = req.body.customer_ids || [];
  const credit_limit = Number(req.body.credit_limit);

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError('لیست شناسه مشتریان الزامی است');
  }
  if (isNaN(credit_limit) || credit_limit < 0) {
    throw new ValidationError('سقف اعتبار نامعتبر است');
  }

  const updatedCount = await CustomerService.bulkUpdateCreditLimit(ids, credit_limit, userId);
  res.sendSuccess({ updatedCount }, 'سقف اعتبار مشتریان به‌روزرسانی شد');
});

/**
 * Can purchase (check credit limit)
 * GET /api/customers/:id/can-purchase?amount=...
 */
export const canPurchase = asyncHandler(async (req: Request, res: Response) => {
  const amount = Number(req.query.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new ValidationError('مبلغ نامعتبر است');
  }

  const allowed = await CustomerService.canPurchase(req.params.id, amount);
  res.sendSuccess({ allowed }, allowed ? 'مشتری مجاز به خرید است' : 'سقف اعتبار کافی نیست');
});

/**
 * Available credit
 * GET /api/customers/:id/available-credit
 */
export const getAvailableCredit = asyncHandler(async (req: Request, res: Response) => {
  const available = await CustomerService.getAvailableCredit(req.params.id);
  res.sendSuccess({ available }, 'اعتبار در دسترس مشتری دریافت شد');
});

// ==========================================
// EXPORTS
// ==========================================

export default {
  // CRUD
  createCustomer,
  getCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,

  // Balance & Credit
  adjustBalance,
  addDebt,
  reduceDebt,
  settleAccount,
  updateCreditLimit,
  canPurchase,
  getAvailableCredit,

  // Lists & Search
  getDebtors,
  getCreditors,
  search,
  advancedSearch,

  // Account & History
  getAccountSummary,
  getPurchaseHistory,
  getTransactions,
  getLifetimeValue,

  // Stats & Reports
  getStatistics,
  getTopCustomers,
  getDebtorReport,
  getCustomersNearingCreditLimit,
  getNewCustomers,
  getInactiveCustomers,

  // Bulk
  bulkSetActive,
  bulkUpdateCreditLimit,
};