// ==========================================
// ZARMIND - Sales Routes
// ==========================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';

import salesController from '../controllers/salesController';
import { validators, validate } from '../middleware/validation.middleware';
import {
  authenticate,
  isEmployee,
  isAdminOrManager,
} from '../middleware/auth.middleware';
import { PaymentMethod, SaleStatus } from '../types';

const router = Router();

// ==========================================
// HELPERS
// ==========================================

const isValidEnum = <T extends string>(val: any, enumObj: Record<string, T>) =>
  Object.values(enumObj).includes(val);

// ==========================================
// CRUD
// ==========================================

// Create sale
router.post(
  '/',
  authenticate,
  isEmployee,
  validators.createSale,
  validate,
  salesController.createSale
);

// List sales (with filters/pagination)
router.get(
  '/',
  authenticate,
  validators.getSales,
  validate,
  salesController.getSales
);

// ==========================================
// REPORTS & ANALYTICS
// ==========================================

// Sales report
router.get(
  '/report',
  authenticate,
  [
    query('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    query('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
  ],
  validate,
  salesController.getSalesReport
);

// Sales performance (today/week/month/year)
router.get(
  '/performance',
  authenticate,
  salesController.getPerformance
);

// Today sales
router.get(
  '/today',
  authenticate,
  salesController.getTodaySales
);

// Today revenue
router.get(
  '/today/revenue',
  authenticate,
  salesController.getTodayRevenue
);

// Recent sales
router.get(
  '/recent',
  authenticate,
  [query('limit').optional().isInt({ min: 1, max: 100 }).toInt()],
  validate,
  salesController.getRecentSales
);

// Sales statistics
router.get(
  '/statistics',
  authenticate,
  [
    query('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    query('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
  ],
  validate,
  salesController.getStatistics
);

// Sales by date range
router.get(
  '/range',
  authenticate,
  [
    query('startDate').notEmpty().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    query('endDate').notEmpty().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
  ],
  validate,
  salesController.getSalesByDateRange
);

// Best selling products
router.get(
  '/best-products',
  authenticate,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    query('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
  ],
  validate,
  salesController.getBestSellingProducts
);

// Sales trend
router.get(
  '/trend',
  authenticate,
  [
    query('period')
      .optional()
      .isIn(['daily', 'weekly', 'monthly'])
      .withMessage('دوره نامعتبر است (daily | weekly | monthly)'),
    query('days').optional().isInt({ min: 1, max: 3650 }).toInt(),
  ],
  validate,
  salesController.getSalesTrend
);

// Conversion rate (drafts to completed)
router.get(
  '/conversion',
  authenticate,
  [
    query('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    query('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
  ],
  validate,
  salesController.getConversionRate
);

// Pending payments
router.get(
  '/pending-payments',
  authenticate,
  salesController.getPendingPayments
);

// Overdue payments
router.get(
  '/overdue-payments',
  authenticate,
  [query('days').optional().isInt({ min: 1, max: 3650 }).toInt()],
  validate,
  salesController.getOverduePayments
);

// Sales by customer
router.get(
  '/customer/:customer_id',
  authenticate,
  [param('customer_id').isUUID().withMessage('شناسه مشتری نامعتبر است')],
  validate,
  salesController.getSalesByCustomer
);

// Receipt by transaction id
router.get(
  '/receipt/:transaction_id',
  authenticate,
  [param('transaction_id').isUUID().withMessage('شناسه تراکنش نامعتبر است')],
  validate,
  salesController.generateReceipt
);

// Generate invoice
router.get(
  '/:id/invoice',
  authenticate,
  [param('id').isUUID().withMessage('شناسه فروش نامعتبر است')],
  validate,
  salesController.generateInvoice
);

// Get sale by sale number
router.get(
  '/number/:sale_number',
  authenticate,
  [param('sale_number').isString().trim().isLength({ min: 1, max: 100 })],
  validate,
  salesController.getSaleByNumber
);

// ==========================================
// SINGLE SALE CRUD (placed AFTER specific routes)
// ==========================================

// Get sale by ID
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID().withMessage('شناسه فروش نامعتبر است')],
  validate,
  salesController.getSale
);

// Update sale
router.put(
  '/:id',
  authenticate,
  isEmployee,
  validators.updateSale,
  validate,
  salesController.updateSale
);

// Update sale status
router.patch(
  '/:id/status',
  authenticate,
  isEmployee,
  [
    param('id').isUUID().withMessage('شناسه فروش نامعتبر است'),
    body('status')
      .notEmpty()
      .custom((val) => isValidEnum(val, SaleStatus))
      .withMessage('وضعیت فروش نامعتبر است'),
  ],
  validate,
  salesController.updateSaleStatus
);

// Cancel sale
router.post(
  '/:id/cancel',
  authenticate,
  isEmployee,
  [
    param('id').isUUID().withMessage('شناسه فروش نامعتبر است'),
    body('reason').optional().isString().trim().isLength({ max: 300 }),
  ],
  validate,
  salesController.cancelSale
);

// Delete sale (draft only)
router.delete(
  '/:id',
  authenticate,
  isAdminOrManager,
  [param('id').isUUID().withMessage('شناسه فروش نامعتبر است')],
  validate,
  salesController.deleteSale
);

// Add payment to sale
router.post(
  '/:id/payments',
  authenticate,
  isEmployee,
  [
    param('id').isUUID().withMessage('شناسه فروش نامعتبر است'),
    body('amount')
      .notEmpty()
      .withMessage('مبلغ الزامی است')
      .isFloat({ min: 0.01 })
      .withMessage('مبلغ باید بزرگ‌تر از صفر باشد')
      .toFloat(),
    body('payment_method')
      .notEmpty()
      .custom((val) => isValidEnum(val, PaymentMethod))
      .withMessage('روش پرداخت نامعتبر است'),
    body('reference_number').optional().isString().trim().isLength({ max: 100 }),
    body('notes').optional().isString().trim().isLength({ max: 500 }),
  ],
  validate,
  salesController.addPayment
);

// ==========================================
// EXPORT
// ==========================================

export default router;  