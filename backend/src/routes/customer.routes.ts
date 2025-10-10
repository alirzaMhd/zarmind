// ==========================================
// ZARMIND - Customer Routes
// ==========================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';

import customerController from '../controllers/customerController';
import { validators, validate } from '../middleware/validation.middleware';
import {
  authenticate,
  isEmployee,
  isAdminOrManager,
} from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// CRUD
// ==========================================

// Create customer
router.post(
  '/',
  authenticate,
  isEmployee,
  validators.createCustomer,
  validate,
  customerController.createCustomer
);

// List customers (with filters/pagination)
router.get(
  '/',
  authenticate,
  validators.getCustomers,
  validate,
  customerController.getCustomers
);

// Get customer by ID
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID().withMessage('شناسه مشتری نامعتبر است')],
  validate,
  customerController.getCustomer
);

// Update customer
router.put(
  '/:id',
  authenticate,
  isEmployee,
  validators.updateCustomer,
  validate,
  customerController.updateCustomer
);

// Delete (soft) customer
router.delete(
  '/:id',
  authenticate,
  isEmployee,
  [param('id').isUUID().withMessage('شناسه مشتری نامعتبر است')],
  validate,
  customerController.deleteCustomer
);

// Restore customer
router.patch(
  '/:id/restore',
  authenticate,
  isEmployee,
  [param('id').isUUID().withMessage('شناسه مشتری نامعتبر است')],
  validate,
  customerController.restoreCustomer
);

// ==========================================
// BALANCE & CREDIT
// ==========================================

// Adjust balance
router.patch(
  '/:id/balance',
  authenticate,
  isEmployee,
  [
    param('id').isUUID().withMessage('شناسه مشتری نامعتبر است'),
    body('type')
      .notEmpty()
      .isIn(['increase', 'decrease', 'set'])
      .withMessage('نوع تغییر مانده نامعتبر است'),
    body('amount')
      .notEmpty()
      .withMessage('مبلغ الزامی است')
      .isFloat({ min: 0 })
      .withMessage('مبلغ باید صفر یا بزرگتر باشد')
      .toFloat(),
    body('reason')
      .notEmpty()
      .withMessage('دلیل تغییر مانده الزامی است')
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('دلیل تغییر مانده نباید بیش از 200 کاراکتر باشد'),
  ],
  validate,
  customerController.adjustBalance
);

// Add debt
router.patch(
  '/:id/debt/add',
  authenticate,
  isEmployee,
  [
    param('id').isUUID().withMessage('شناسه مشتری نامعتبر است'),
    body('amount')
      .notEmpty()
      .withMessage('مبلغ الزامی است')
      .isFloat({ min: 1 })
      .withMessage('مبلغ باید بزرگ‌تر از صفر باشد')
      .toFloat(),
    body('reason').optional().isString().trim().isLength({ max: 200 }),
  ],
  validate,
  customerController.addDebt
);

// Reduce debt
router.patch(
  '/:id/debt/reduce',
  authenticate,
  isEmployee,
  [
    param('id').isUUID().withMessage('شناسه مشتری نامعتبر است'),
    body('amount')
      .notEmpty()
      .withMessage('مبلغ الزامی است')
      .isFloat({ min: 1 })
      .withMessage('مبلغ باید بزرگ‌تر از صفر باشد')
      .toFloat(),
    body('reason').optional().isString().trim().isLength({ max: 200 }),
  ],
  validate,
  customerController.reduceDebt
);

// Settle account
router.patch(
  '/:id/settle',
  authenticate,
  isEmployee,
  [param('id').isUUID().withMessage('شناسه مشتری نامعتبر است')],
  validate,
  customerController.settleAccount
);

// Update credit limit (restrict to admin/manager)
router.patch(
  '/:id/credit-limit',
  authenticate,
  isAdminOrManager,
  [
    param('id').isUUID().withMessage('شناسه مشتری نامعتبر است'),
    body('credit_limit')
      .notEmpty()
      .withMessage('سقف اعتبار الزامی است')
      .isFloat({ min: 0 })
      .withMessage('سقف اعتبار باید صفر یا بزرگتر باشد')
      .toFloat(),
  ],
  validate,
  customerController.updateCreditLimit
);

// Can purchase (check credit limit)
router.get(
  '/:id/can-purchase',
  authenticate,
  [
    param('id').isUUID().withMessage('شناسه مشتری نامعتبر است'),
    query('amount')
      .notEmpty()
      .withMessage('مبلغ الزامی است')
      .isFloat({ min: 1 })
      .withMessage('مبلغ باید بزرگ‌تر از صفر باشد')
      .toFloat(),
  ],
  validate,
  customerController.canPurchase
);

// Available credit
router.get(
  '/:id/available-credit',
  authenticate,
  [param('id').isUUID().withMessage('شناسه مشتری نامعتبر است')],
  validate,
  customerController.getAvailableCredit
);

// ==========================================
// LISTS & SEARCH
// ==========================================

// Debtors
router.get(
  '/debtors',
  authenticate,
  customerController.getDebtors
);

// Creditors
router.get(
  '/creditors',
  authenticate,
  customerController.getCreditors
);

// Search
router.get(
  '/search',
  authenticate,
  [
    query('q').optional().isString().trim(),
    query('query').optional().isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  customerController.search
);

// Advanced search (reuse validators for list)
router.get(
  '/advanced',
  authenticate,
  validators.getCustomers,
  validate,
  customerController.advancedSearch
);

// Account summary
router.get(
  '/:id/account',
  authenticate,
  [param('id').isUUID().withMessage('شناسه مشتری نامعتبر است')],
  validate,
  customerController.getAccountSummary
);

// Purchase history
router.get(
  '/:id/purchase-history',
  authenticate,
  [param('id').isUUID().withMessage('شناسه مشتری نامعتبر است')],
  validate,
  customerController.getPurchaseHistory
);

// Transactions history
router.get(
  '/:id/transactions',
  authenticate,
  [param('id').isUUID().withMessage('شناسه مشتری نامعتبر است')],
  validate,
  customerController.getTransactions
);

// Lifetime value
router.get(
  '/:id/lifetime-value',
  authenticate,
  [param('id').isUUID().withMessage('شناسه مشتری نامعتبر است')],
  validate,
  customerController.getLifetimeValue
);

// ==========================================
// STATS & REPORTS
// ==========================================

// Statistics
router.get(
  '/statistics',
  authenticate,
  customerController.getStatistics
);

// Top customers
router.get(
  '/top',
  authenticate,
  [query('limit').optional().isInt({ min: 1, max: 100 }).toInt()],
  validate,
  customerController.getTopCustomers
);

// Debtor report
router.get(
  '/debtor-report',
  authenticate,
  customerController.getDebtorReport
);

// Near credit limit
router.get(
  '/near-credit-limit',
  authenticate,
  [query('threshold').optional().isInt({ min: 1, max: 100 }).toInt()],
  validate,
  customerController.getCustomersNearingCreditLimit
);

// New customers (this month)
router.get(
  '/new',
  authenticate,
  customerController.getNewCustomers
);

// Inactive customers
router.get(
  '/inactive',
  authenticate,
  [query('days').optional().isInt({ min: 1, max: 3650 }).toInt()],
  validate,
  customerController.getInactiveCustomers
);

// ==========================================
// BULK OPERATIONS
// ==========================================

// Bulk set active
router.post(
  '/bulk/active',
  authenticate,
  isAdminOrManager,
  [
    body('customer_ids')
      .isArray({ min: 1 })
      .withMessage('لیست شناسه مشتریان الزامی است'),
    body('customer_ids.*')
      .isUUID()
      .withMessage('شناسه مشتری نامعتبر است'),
    body('is_active')
      .isBoolean()
      .withMessage('وضعیت باید بولین باشد')
      .toBoolean(),
  ],
  validate,
  customerController.bulkSetActive
);

// Bulk update credit limit
router.post(
  '/bulk/credit-limit',
  authenticate,
  isAdminOrManager,
  [
    body('customer_ids')
      .isArray({ min: 1 })
      .withMessage('لیست شناسه مشتریان الزامی است'),
    body('customer_ids.*')
      .isUUID()
      .withMessage('شناسه مشتری نامعتبر است'),
    body('credit_limit')
      .notEmpty()
      .withMessage('سقف اعتبار الزامی است')
      .isFloat({ min: 0 })
      .withMessage('سقف اعتبار باید صفر یا بزرگتر باشد')
      .toFloat(),
  ],
  validate,
  customerController.bulkUpdateCreditLimit
);

// ==========================================
// EXPORT
// ==========================================

export default router;