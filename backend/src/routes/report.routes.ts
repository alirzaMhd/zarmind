// ==========================================
// ZARMIND - Report Routes
// ==========================================

import { Router } from 'express';
import { query, body } from 'express-validator';

import reportController from '../controllers/reportController';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// ==========================================
// DASHBOARD & QUICK STATS
// ==========================================

/**
 * @route   GET /api/reports/dashboard
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get(
  '/dashboard',
  authenticate,
  reportController.getDashboardStats
);

/**
 * @route   GET /api/reports/quick-stats
 * @desc    Get quick stats (widgets)
 * @access  Private
 */
router.get(
  '/quick-stats',
  authenticate,
  reportController.getQuickStats
);

// ==========================================
// SALES REPORTS
// ==========================================

/**
 * @route   GET /api/reports/sales
 * @desc    Sales report (optional date range)
 * @access  Private
 */
router.get(
  '/sales',
  authenticate,
  [
    query('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    query('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
  ],
  validate,
  reportController.getSalesReport
);

/**
 * @route   GET /api/reports/comparative-sales
 * @desc    Comparative sales report (current vs previous)
 * @access  Private
 */
router.get(
  '/comparative-sales',
  authenticate,
  [
    query('currentStart').notEmpty().isISO8601().withMessage('تاریخ شروع (دوره فعلی) نامعتبر است'),
    query('currentEnd').notEmpty().isISO8601().withMessage('تاریخ پایان (دوره فعلی) نامعتبر است'),
    query('previousStart').notEmpty().isISO8601().withMessage('تاریخ شروع (دوره قبل) نامعتبر است'),
    query('previousEnd').notEmpty().isISO8601().withMessage('تاریخ پایان (دوره قبل) نامعتبر است'),
  ],
  validate,
  reportController.getComparativeSalesReport
);

// ==========================================
// INVENTORY REPORTS
// ==========================================

/**
 * @route   GET /api/reports/inventory
 * @desc    Inventory report
 * @access  Private
 */
router.get(
  '/inventory',
  authenticate,
  reportController.getInventoryReport
);

// ==========================================
// CUSTOMER REPORTS
// ==========================================

/**
 * @route   GET /api/reports/customers
 * @desc    Customer report
 * @access  Private
 */
router.get(
  '/customers',
  authenticate,
  reportController.getCustomerReport
);

// ==========================================
// FINANCIAL / P&L
// ==========================================

/**
 * @route   GET /api/reports/financial
 * @desc    Financial report (optional date range)
 * @access  Private
 */
router.get(
  '/financial',
  authenticate,
  [
    query('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    query('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
  ],
  validate,
  reportController.getFinancialReport
);

/**
 * @route   GET /api/reports/profit-loss
 * @desc    Profit & Loss report (optional date range)
 * @access  Private
 */
router.get(
  '/profit-loss',
  authenticate,
  [
    query('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    query('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
  ],
  validate,
  reportController.getProfitLossReport
);

// ==========================================
// GOLD PRICE TRENDS
// ==========================================

/**
 * @route   GET /api/reports/gold-price-trend
 * @desc    Gold price trend
 * @access  Private
 */
router.get(
  '/gold-price-trend',
  authenticate,
  [
    query('carat')
      .notEmpty()
      .withMessage('عیار الزامی است')
      .isIn(['18', '21', '22', '24'])
      .withMessage('عیار نامعتبر است (18، 21، 22 یا 24)')
      .toInt(),
    query('days')
      .optional()
      .isInt({ min: 1, max: 3650 })
      .withMessage('تعداد روز نامعتبر است')
      .toInt(),
  ],
  validate,
  reportController.getGoldPriceTrend
);

// ==========================================
// EXPORT
// ==========================================

/**
 * @route   POST /api/reports/export
 * @desc    Export report JSON
 * @access  Private
 */
router.post(
  '/export',
  authenticate,
  [
    body('report')
      .optional()
      .isObject()
      .withMessage('داده گزارش باید شیء معتبر باشد'),
  ],
  validate,
  reportController.exportReport
);

// ==========================================
// EXPORT DEFAULT
// ==========================================

export default router;