// ==========================================
// ZARMIND - Report Controller
// ==========================================

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import ReportService, { IDateRange } from '../services/reportService';
import { ValidationError } from '../types';

// ==========================================
// HELPERS
// ==========================================

const parseDate = (val: any, fieldName: string): Date | undefined => {
  if (val === undefined || val === null || String(val).trim() === '') return undefined;
  const d = new Date(String(val));
  if (isNaN(d.getTime())) {
    throw new ValidationError(`تاریخ ${fieldName} نامعتبر است`);
  }
  return d;
};

const getDateRangeFromQuery = (req: Request): IDateRange | undefined => {
  const start = parseDate(req.query.startDate, 'شروع');
  const end = parseDate(req.query.endDate, 'پایان');

  if ((start && !end) || (!start && end)) {
    throw new ValidationError('برای بازه زمانی، هر دو تاریخ شروع و پایان الزامی است');
  }

  return start && end ? { startDate: start, endDate: end } : undefined;
};

// ==========================================
// DASHBOARD & QUICK STATS
// ==========================================

/**
 * GET /api/reports/dashboard
 */
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await ReportService.getDashboardStats();
  res.sendSuccess(data, 'آمار داشبورد با موفقیت دریافت شد');
});

/**
 * GET /api/reports/quick-stats
 */
export const getQuickStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await ReportService.getQuickStats();
  res.sendSuccess(data, 'آمار سریع با موفقیت دریافت شد');
});

// ==========================================
// SALES REPORTS
// ==========================================

/**
 * GET /api/reports/sales?startDate=...&endDate=...
 */
export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const range = getDateRangeFromQuery(req);
  const report = await ReportService.getSalesReport(range);
  res.sendSuccess(report, 'گزارش فروش با موفقیت دریافت شد');
});

/**
 * GET /api/reports/comparative-sales?currentStart=...&currentEnd=...&previousStart=...&previousEnd=...
 */
export const getComparativeSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const currentStart = parseDate(req.query.currentStart, 'شروع (دوره فعلی)');
  const currentEnd = parseDate(req.query.currentEnd, 'پایان (دوره فعلی)');
  const previousStart = parseDate(req.query.previousStart, 'شروع (دوره قبل)');
  const previousEnd = parseDate(req.query.previousEnd, 'پایان (دوره قبل)');

  if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
    throw new ValidationError('همه تاریخ‌های دوره فعلی و دوره قبل الزامی هستند');
  }

  const current: IDateRange = { startDate: currentStart, endDate: currentEnd };
  const previous: IDateRange = { startDate: previousStart, endDate: previousEnd };

  const report = await ReportService.getComparativeSalesReport(current, previous);
  res.sendSuccess(report, 'گزارش مقایسه‌ای فروش با موفقیت دریافت شد');
});

// ==========================================
// INVENTORY REPORTS
// ==========================================

/**
 * GET /api/reports/inventory
 */
export const getInventoryReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = await ReportService.getInventoryReport();
  res.sendSuccess(report, 'گزارش موجودی با موفقیت دریافت شد');
});

// ==========================================
// CUSTOMER REPORTS
// ==========================================

/**
 * GET /api/reports/customers
 */
export const getCustomerReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = await ReportService.getCustomerReport();
  res.sendSuccess(report, 'گزارش مشتریان با موفقیت دریافت شد');
});

// ==========================================
// FINANCIAL / P&L
// ==========================================

/**
 * GET /api/reports/financial?startDate=...&endDate=...
 */
export const getFinancialReport = asyncHandler(async (req: Request, res: Response) => {
  const range = getDateRangeFromQuery(req);
  const report = await ReportService.getFinancialReport(range);
  res.sendSuccess(report, 'گزارش مالی با موفقیت دریافت شد');
});

/**
 * GET /api/reports/profit-loss?startDate=...&endDate=...
 */
export const getProfitLossReport = asyncHandler(async (req: Request, res: Response) => {
  const range = getDateRangeFromQuery(req);
  const report = await ReportService.getProfitLossReport(range);
  res.sendSuccess(report, 'گزارش سود و زیان با موفقیت دریافت شد');
});

// ==========================================
// GOLD PRICE TRENDS
// ==========================================

/**
 * GET /api/reports/gold-price-trend?carat=18&days=30
 */
export const getGoldPriceTrend = asyncHandler(async (req: Request, res: Response) => {
  const carat = req.query.carat ? parseInt(String(req.query.carat), 10) : undefined;
  const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;

  if (!carat || ![18, 21, 22, 24].includes(carat)) {
    throw new ValidationError('عیار نامعتبر است (18، 21، 22 یا 24)');
    }
  if (isNaN(days) || days <= 0) {
    throw new ValidationError('تعداد روزها نامعتبر است');
  }

  const trend = await ReportService.getGoldPriceTrend(carat, days);
  res.sendSuccess(trend, 'روند قیمت طلا با موفقیت دریافت شد');
});

// ==========================================
// EXPORT
// ==========================================

/**
 * POST /api/reports/export
 * Body: any report object (reportData)
 */
export const exportReport = asyncHandler(async (req: Request, res: Response) => {
  const reportData = req.body?.report ?? req.body;
  if (!reportData) {
    throw new ValidationError('داده‌ای برای خروجی گرفتن ارسال نشده است');
  }

  const json = await ReportService.exportReportToJSON(reportData);

  // Optional: set as downloadable file
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="report.json"');

  res.send(json);
});

// ==========================================
// EXPORTS
// ==========================================

export default {
  // Dashboard
  getDashboardStats,
  getQuickStats,

  // Sales
  getSalesReport,
  getComparativeSalesReport,

  // Inventory
  getInventoryReport,

  // Customers
  getCustomerReport,

  // Financial & P&L
  getFinancialReport,
  getProfitLossReport,

  // Gold trend
  getGoldPriceTrend,

  // Export
  exportReport,
};